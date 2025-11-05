import { lazyLoadAd, setAutoRefresh, clearAutoRefresh } from "../core/utils";

/**
 * GPT (Google Publisher Tag) platform wrapper
 */
export const GPT = {
    /**
     * Initialize GPT
     * @param {Object} config - Config object
     */
    init(config) {
        this.config = config;
        this.pubId = config.pubId;
        this.slots = [];

        if (!window.googletag) {
            window.googletag = window.googletag || {};
            window.googletag.cmd = window.googletag.cmd || [];
        }

        // Enable services
        window.googletag.cmd.push(() => {
            window.googletag.pubads().enableSingleRequest();
            window.googletag.pubads().enableAsyncRendering();
            window.googletag.pubads().collapseEmptyDivs();

            // Set publisher ID
            if (config.pubId) {
                window.googletag.pubads().setPublisherProvidedId(config.pubId);
            }

            // Enable native ad support
            if (config.nativeAfgSupport) {
                window.googletag.pubads().enableNativeAds();
            }

            // Additional GPT config
            if (config.gptConfig && typeof config.gptConfig === "object") {
                Object.keys(config.gptConfig).forEach((key) => {
                    if (typeof window.googletag.pubads()[key] === "function") {
                        window.googletag.pubads()[key](config.gptConfig[key]);
                    }
                });
            }
        });
    },

    /**
     * Define ad slot
     * @param {Object} options - Ad options
     * @param {string} options.adUnitPath - Ad unit path (e.g., '/12345678/example')
     * @param {string} options.size - Ad size (e.g., [300, 250] or [[300, 250], [728, 90]])
     * @param {string} options.divId - Container div ID
     * @param {Object} options.targeting - Targeting parameters
     * @param {boolean} options.lazyLoad - Enable lazy load (default: false)
     * @param {number} options.autoRefreshSeconds - Auto refresh seconds (0 = disabled)
     * @returns {Object} Slot object
     */
    defineSlot(options = {}) {
        if (!this.config) {
            throw new Error("GPT not initialized, call c3.init() first");
        }

        const {
            adUnitPath,
            size,
            divId,
            targeting = {},
            lazyLoad = false,
            autoRefreshSeconds = 0,
        } = options;

        if (!adUnitPath || !size || !divId) {
            throw new Error("adUnitPath, size and divId are required");
        }

        // Ensure container exists
        let container = document.getElementById(divId);
        if (!container) {
            container = document.createElement("div");
            container.id = divId;
            document.body.appendChild(container);
        }

        let slot;

        // Load ad function
        const loadAd = () => {
            window.googletag.cmd.push(() => {
                // Define slot
                slot = window.googletag.defineSlot(adUnitPath, size, divId);

                if (!slot) {
                    throw new Error("Failed to define slot");
                }

                // Set targeting parameters
                Object.keys(targeting).forEach((key) => {
                    slot.setTargeting(key, targeting[key]);
                });

                // Add service
                slot.addService(window.googletag.pubads());

                // Display ad
                window.googletag.display(divId);
            });
        };

        // Refresh ad function
        const refreshAd = () => {
            if (slot) {
                window.googletag.cmd.push(() => {
                    window.googletag.pubads().refresh([slot]);
                });
            }
        };

        // Lazy load or immediate load
        let observer = null;
        if (lazyLoad) {
            observer = lazyLoadAd(container, loadAd, { rootMargin: "50px" });
        } else {
            loadAd();
        }

        // Setup auto refresh
        let refreshTimer = null;
        if (autoRefreshSeconds > 0) {
            refreshTimer = setAutoRefresh(refreshAd, autoRefreshSeconds);
        }

        const slotObject = {
            slot,
            adUnitPath,
            size,
            divId,
            targeting,
            lazyLoad,
            autoRefreshSeconds,
            refreshTimer,
            observer,
        };

        this.slots.push(slotObject);
        return slotObject;
    },

    /**
     * Refresh slot
     * @param {string} divId - Container div ID
     * @param {Object} options - Refresh options
     */
    refresh(divId, options = {}) {
        const slotObj = this.slots.find((s) => s.divId === divId);
        if (!slotObj || !slotObj.slot) {
            throw new Error(`Slot not found: ${divId}`);
        }

        window.googletag.cmd.push(() => {
            window.googletag.pubads().refresh([slotObj.slot], options);
        });
    },

    /**
     * Preload ads
     */
    preload() {
        if (this.config && this.config.preloadAd) {
            window.googletag.cmd.push(() => {
                // GPT handles preload automatically
                console.log("GPT preload enabled");
            });
        }
    },

    /**
     * Clear slot
     * @param {string} divId - Container div ID
     */
    clear(divId) {
        const slotObj = this.slots.find((s) => s.divId === divId);
        if (slotObj && slotObj.slot) {
            window.googletag.cmd.push(() => {
                window.googletag.pubads().clear([slotObj.slot]);
            });
        }
    },

    /**
     * Remove slot
     * @param {string} divId - Container div ID
     */
    remove(divId) {
        const index = this.slots.findIndex((s) => s.divId === divId);
        if (index !== -1) {
            const slotObj = this.slots[index];

            // Clear auto refresh timer
            if (slotObj.refreshTimer) {
                clearAutoRefresh(slotObj.refreshTimer);
            }

            // Disconnect Observer
            if (slotObj.observer) {
                slotObj.observer.disconnect();
            }

            if (slotObj.slot) {
                window.googletag.cmd.push(() => {
                    window.googletag.destroySlots([slotObj.slot]);
                });
            }

            // Remove DOM element
            const container = document.getElementById(divId);
            if (container) {
                container.parentNode.removeChild(container);
            }

            this.slots.splice(index, 1);
        }
    },

    /**
     * Get all slots
     */
    getSlots() {
        return this.slots;
    },

    /**
     * Set page-level targeting
     * @param {string} key - Key
     * @param {string|string[]} value - Value
     */
    setTargeting(key, value) {
        window.googletag.cmd.push(() => {
            window.googletag.pubads().setTargeting(key, value);
        });
    },
};
