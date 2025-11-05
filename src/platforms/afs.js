import {
    loadScript,
    lazyLoadAd,
    setAutoRefresh,
    clearAutoRefresh,
} from "../core/utils";

/**
 * AFS (AdSense for Search) platform wrapper
 */
export const AFS = {
    /**
     * Initialize AFS
     * @param {Object} config - Config object
     */
    init(config) {
        this.config = config;
        this.searchBoxes = [];
    },

    /**
     * Create search box
     * @param {Object} options - Search box options
     * @param {string} options.containerId - Container ID
     * @param {string} options.pubId - Publisher ID (use init pubId if not provided)
     * @param {string} options.channelId - Channel ID
     * @param {string} options.placeholder - Placeholder text
     * @param {string} options.language - Language code (e.g., 'zh_CN')
     * @param {string} options.searchEngineId - Custom search engine ID
     * @returns {Object} Search box object
     */
    createSearchBox(options = {}) {
        if (!this.config) {
            throw new Error("AFS not initialized, call c3.init() first");
        }

        const {
            containerId,
            pubId = this.config.pubId || "",
            channelId = this.config.channelId || "",
            placeholder = "Search...",
            language = "zh_CN",
            searchEngineId = "",
        } = options;

        if (!containerId) {
            throw new Error("containerId is required");
        }

        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            document.body.appendChild(container);
        }

        // Create search form
        const form = document.createElement("form");
        form.id = `afs-search-form-${containerId}`;
        form.method = "get";
        form.action = "https://www.google.com/search";

        // Create search input
        const input = document.createElement("input");
        input.type = "text";
        input.name = "q";
        input.placeholder = placeholder;
        input.style.width = "100%";
        input.style.padding = "8px";
        input.style.fontSize = "16px";

        // Create search button
        const button = document.createElement("button");
        button.type = "submit";
        button.textContent = "Search";
        button.style.padding = "8px 16px";
        button.style.marginLeft = "8px";

        // Add hidden fields
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = "cx";
        hiddenInput.value =
            searchEngineId || `partner-pub-${pubId}:${channelId}`;

        const hiddenInput2 = document.createElement("input");
        hiddenInput2.type = "hidden";
        hiddenInput2.name = "ie";
        hiddenInput2.value = "UTF-8";

        // Assemble form
        form.appendChild(input);
        form.appendChild(button);
        form.appendChild(hiddenInput);
        form.appendChild(hiddenInput2);

        // Append to container
        container.appendChild(form);

        // Create results container
        const resultsContainer = document.createElement("div");
        resultsContainer.id = `afs-results-${containerId}`;
        resultsContainer.style.marginTop = "16px";
        container.appendChild(resultsContainer);

        // Load search results script if custom engine used
        if (searchEngineId) {
            loadScript(`https://www.google.com/cse?cx=${searchEngineId}`, {
                async: true,
            }).catch((err) => {
                console.error("AFS search results script load failed:", err);
            });
        }

        const searchBoxObject = {
            containerId,
            form,
            input,
            button,
            resultsContainer,
            pubId,
            channelId,
            language,
        };

        this.searchBoxes.push(searchBoxObject);
        return searchBoxObject;
    },

    /**
     * Create AdSense search results ad
     * @param {Object} options - Ad options
     * @param {string} options.containerId - Container ID
     * @param {string} options.adSlotId - Ad slot ID
     * @param {string} options.adFormat - Ad format
     * @param {boolean} options.lazyLoad - Enable lazy load (default: false)
     * @param {number} options.autoRefreshSeconds - Auto refresh seconds (0 = disabled)
     * @returns {Object} Ad object
     */
    createSearchAd(options = {}) {
        if (!this.config) {
            throw new Error("AFS not initialized, call c3.init() first");
        }

        const {
            containerId,
            adSlotId,
            adFormat = "auto",
            lazyLoad = false,
            autoRefreshSeconds = 0,
        } = options;

        if (!containerId || !adSlotId) {
            throw new Error("containerId and adSlotId are required");
        }

        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container not found: ${containerId}`);
        }

        // Create AdSense ad unit
        const ins = document.createElement("ins");
        ins.className = "adsbygoogle";
        ins.style.display = "block";
        ins.setAttribute("data-ad-client", this.config.pubId || "");
        ins.setAttribute("data-ad-slot", adSlotId);
        ins.setAttribute("data-ad-format", adFormat);
        ins.setAttribute("data-full-width-responsive", "true");

        container.appendChild(ins);

        // Load ad function
        const loadAd = () => {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error("AFS ad push failed:", e);
            }
        };

        // Refresh ad function
        const refreshAd = () => {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error("AFS ad refresh failed:", e);
            }
        };

        // Lazy load or immediate load
        let observer = null;
        if (lazyLoad) {
            observer = lazyLoadAd(ins, loadAd, { rootMargin: "50px" });
        } else {
            loadAd();
        }

        // Setup auto refresh
        let refreshTimer = null;
        if (autoRefreshSeconds > 0) {
            refreshTimer = setAutoRefresh(refreshAd, autoRefreshSeconds);
        }

        const adObject = {
            element: ins,
            adSlotId,
            containerId,
            lazyLoad,
            autoRefreshSeconds,
            refreshTimer,
            observer,
        };

        // Save ad object to search box (if exists)
        const searchBox = this.searchBoxes.find(
            (box) => box.containerId === containerId
        );
        if (searchBox) {
            if (!searchBox.ads) {
                searchBox.ads = [];
            }
            searchBox.ads.push(adObject);
        }

        return adObject;
    },

    /**
     * Get all search boxes
     */
    getSearchBoxes() {
        return this.searchBoxes;
    },

    /**
     * Remove search box
     * @param {string} containerId - Container ID
     */
    remove(containerId) {
        const index = this.searchBoxes.findIndex(
            (box) => box.containerId === containerId
        );
        if (index !== -1) {
            const box = this.searchBoxes[index];

            // Clear all associated ad timers and observers
            if (box.ads && Array.isArray(box.ads)) {
                box.ads.forEach((ad) => {
                    if (ad.refreshTimer) {
                        clearAutoRefresh(ad.refreshTimer);
                    }
                    if (ad.observer) {
                        ad.observer.disconnect();
                    }
                });
            }

            const container = document.getElementById(containerId);
            if (container) {
                container.parentNode.removeChild(container);
            }
            this.searchBoxes.splice(index, 1);
        }
    },
};
