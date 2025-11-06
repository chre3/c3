import { lazyLoadAd, setAutoRefresh, clearAutoRefresh } from "../core/utils";

/**
 * AdSense platform wrapper
 */
export const AdSense = {
    /**
     * Initialize AdSense
     * @param {Object} config - Config object
     */
    init(config) {
        this.config = config;
        this.pubId = config.pubId;
        this.ads = [];
        this.hashChangeHandler = null;
        this.adCounter = 0; // Counter for unique ad IDs

        // Setup listener if vignette/preroll management enabled
        const vignetteConfig =
            (config.adsenseConfig && config.adsenseConfig.vignetteConfig) ||
            config.vignetteConfig;
        if (vignetteConfig && vignetteConfig.enabled) {
            this.setupHashChangeListener();
        }

        // Setup initial preroll (if delay configured)
        if (vignetteConfig && vignetteConfig.initialPrerollDelay > 0) {
            this.setupInitialPreroll();
        }

        // Setup initial reward (if delay configured)
        const rewardConfig =
            (config.adsenseConfig && config.adsenseConfig.rewardConfig) || {};
        if (rewardConfig.initialRewardDelay > 0) {
            this.setupInitialReward();
        }
    },

    /**
     * Setup hashchange listener for vignette/preroll detection
     */
    setupHashChangeListener() {
        const vignetteConfig = this.getVignetteConfig();
        if (!vignetteConfig || !vignetteConfig.enabled) {
            return;
        }

        // Initialize sessionStorage data
        this.initAdTracking();

        // Listen to hashchange event
        this.hashChangeHandler = () => {
            this.handleHashChange();
        };

        window.addEventListener("hashchange", this.hashChangeHandler);

        // Setup timer to check for missed vignettes
        if (vignetteConfig.maxVignetteMissed > 0) {
            this.vignetteCheckInterval = setInterval(() => {
                this.checkMissedVignette();
            }, 30000); // Check every 30s
        }

        // Initial check
        this.handleHashChange();

        // Initialize cycle state
        this.initCycleState();
    },

    /**
     * Get vignette/preroll config
     */
    getVignetteConfig() {
        return (
            (this.config.adsenseConfig &&
                this.config.adsenseConfig.vignetteConfig) ||
            this.config.vignetteConfig
        );
    },

    /**
     * Check for missed vignettes
     */
    checkMissedVignette() {
        const config = this.getVignetteConfig();
        if (!config || !config.enabled || config.maxVignetteMissed <= 0) {
            return;
        }

        const tracking = this.getAdTracking();
        if (!tracking) {
            return;
        }

        const now = Date.now();
        const timeSinceLastVignette = now - (tracking.lastVignetteTime || 0);

        // Increase missed count if no vignette for 60s
        if (timeSinceLastVignette > 60000 && tracking.lastVignetteTime > 0) {
            const newMissedCount = (tracking.missedVignetteCount || 0) + 1;
            this.updateAdTracking({
                missedVignetteCount: newMissedCount,
            });

            // Trigger preroll if threshold reached
            if (newMissedCount >= config.maxVignetteMissed) {
                this._internalShowPreroll();
            }
        }
    },

    /**
     * Initialize ad tracking data
     */
    initAdTracking() {
        const storageKey = "c3_adsense_ad_tracking";
        const data = sessionStorage.getItem(storageKey);

        if (!data) {
            const initialData = {
                vignetteCount: 0, // Current cycle vignette count
                prerollCount: 0, // Current cycle preroll count
                lastVignetteTime: 0, // Last vignette time
                missedVignetteCount: 0, // Missed vignette count
                totalVignetteCount: 0, // Total vignette count
                totalPrerollCount: 0, // Total preroll count
                currentCycle: "vignette", // Current cycle: "vignette" or "preroll"
            };
            sessionStorage.setItem(storageKey, JSON.stringify(initialData));
        }
    },

    /**
     * Initialize cycle state
     */
    initCycleState() {
        const tracking = this.getAdTracking();
        if (tracking && !tracking.currentCycle) {
            this.updateAdTracking({
                currentCycle: "vignette", // Start with vignette
            });
        }
    },

    /**
     * Get ad tracking data
     */
    getAdTracking() {
        const storageKey = "c3_adsense_ad_tracking";
        const data = sessionStorage.getItem(storageKey);
        return data ? JSON.parse(data) : null;
    },

    /**
     * Update ad tracking data
     */
    updateAdTracking(updates) {
        const storageKey = "c3_adsense_ad_tracking";
        const currentData = this.getAdTracking() || {
            vignetteCount: 0,
            prerollCount: 0,
            lastVignetteTime: 0,
            missedVignetteCount: 0,
            totalVignetteCount: 0,
            totalPrerollCount: 0,
            currentCycle: "vignette",
        };

        const newData = { ...currentData, ...updates };
        sessionStorage.setItem(storageKey, JSON.stringify(newData));
        return newData;
    },

    /**
     * Handle hashchange event
     */
    handleHashChange() {
        const hash = window.location.hash;
        const config = this.getVignetteConfig();

        if (!config || !config.enabled) {
            return;
        }

        let tracking = this.getAdTracking();

        // Detect vignette ad (google_vignette)
        if (hash.includes("google_vignette")) {
            const newVignetteCount = (tracking.vignetteCount || 0) + 1;
            const newTotalVignetteCount =
                (tracking.totalVignetteCount || 0) + 1;

            tracking = this.updateAdTracking({
                vignetteCount: newVignetteCount,
                totalVignetteCount: newTotalVignetteCount,
                lastVignetteTime: Date.now(),
                missedVignetteCount: 0, // Reset missed count
                currentCycle: "vignette", // Current in vignette cycle
            });

            console.log(
                `Vignette detected, count: ${newVignetteCount}/${config.vignetteToPreroll.count}`
            );

            // Check if threshold reached, trigger preroll
            if (
                newVignetteCount >= config.vignetteToPreroll.count &&
                config.vignetteToPreroll.count > 0
            ) {
                // Reset counts, enter preroll cycle
                tracking = this.updateAdTracking({
                    vignetteCount: 0,
                    prerollCount: 0, // Reset preroll count
                    currentCycle: "preroll", // Switch to preroll cycle
                });

                // Trigger preroll (based on trigger count)
                const triggerCount = config.vignetteToPreroll.trigger || 1;
                console.log(
                    `Vignette threshold reached, triggering ${triggerCount} preroll(s)`
                );

                // Delay to avoid immediate trigger
                setTimeout(() => {
                    this.triggerPrerollCycle(triggerCount, 0);
                }, 100);
            }
        }
        // Detect preroll ad (goog_fullscreen_ad)
        else if (hash.includes("goog_fullscreen_ad")) {
            const newPrerollCount = (tracking.prerollCount || 0) + 1;
            const newTotalPrerollCount = (tracking.totalPrerollCount || 0) + 1;

            tracking = this.updateAdTracking({
                prerollCount: newPrerollCount,
                totalPrerollCount: newTotalPrerollCount,
                missedVignetteCount: 0, // Reset missed count
                currentCycle: "preroll", // Current in preroll cycle
            });

            console.log(
                `Preroll detected, count: ${newPrerollCount}/${config.prerollToVignette.count}`
            );

            // Check if threshold reached, enter vignette cycle
            if (
                newPrerollCount >= config.prerollToVignette.count &&
                config.prerollToVignette.count > 0
            ) {
                // Reset counts, enter vignette cycle
                tracking = this.updateAdTracking({
                    vignetteCount: 0, // Reset vignette count
                    prerollCount: 0,
                    currentCycle: "vignette", // Switch back to vignette cycle
                });

                console.log(
                    `Preroll threshold reached, entering vignette cycle (${config.prerollToVignette.trigger} vignettes)`
                );
                // Vignette ads are controlled by AdSense, mainly recording state here
            }
        }
        // Hash changed but no ad detected, increase missed count (fallback)
        else if (hash && hash !== window.location.hash) {
            // Check if preroll needed
            const newMissedCount = (tracking.missedVignetteCount || 0) + 1;
            tracking = this.updateAdTracking({
                missedVignetteCount: newMissedCount,
            });

            // Trigger preroll if missed threshold reached (fallback)
            if (
                newMissedCount >= config.maxVignetteMissed &&
                config.maxVignetteMissed > 0 &&
                tracking.currentCycle === "vignette"
            ) {
                setTimeout(() => {
                    this._internalShowPreroll();
                }, 100);
            }
        }
    },

    /**
     * Check and trigger preroll
     * Decide whether to show preroll based on config rules
     */
    checkAndTriggerPreroll() {
        const config = this.getVignetteConfig();
        if (!config || !config.enabled) {
            return false;
        }

        const tracking = this.getAdTracking();
        if (!tracking) {
            return false;
        }

        // Check if vignette threshold reached
        const shouldShowPreroll =
            tracking.vignetteCount >= config.vignetteToPreroll.count &&
            config.vignetteToPreroll.count > 0 &&
            tracking.currentCycle === "vignette";

        // Check if missed threshold reached (fallback)
        const shouldShowPrerollForMissed =
            tracking.missedVignetteCount >= config.maxVignetteMissed &&
            config.maxVignetteMissed > 0 &&
            tracking.currentCycle === "vignette";

        if (shouldShowPreroll) {
            // Trigger preroll with specified count
            const triggerCount = config.vignetteToPreroll.trigger || 1;
            this.triggerPrerollCycle(triggerCount, 0);
            return true;
        }

        if (shouldShowPrerollForMissed) {
            this._internalShowPreroll();
            return true;
        }

        return false;
    },

    /**
     * Check if AdSense interstitial API is ready
     * @returns {boolean} True if ready
     */
    _isInterstitialAPIReady() {
        // Check if AdSense script is loaded
        if (!window.adsbygoogle) {
            return false;
        }

        // Check if script is loaded (adsbygoogle should be an array)
        if (typeof window.adsbygoogle !== "object") {
            return false;
        }

        // Additional check: ensure script is loaded
        const scriptLoaded = document.querySelector(
            'script[src*="adsbygoogle.js"]'
        );
        if (!scriptLoaded) {
            return false;
        }

        return true;
    },

    /**
     * Show preroll with retry logic
     * @param {Function} showFn - Function to show preroll
     * @param {number} retryCount - Current retry count
     * @param {number} maxRetries - Maximum retries
     */
    _showPrerollWithRetry(showFn, retryCount = 0, maxRetries = 5) {
        if (retryCount >= maxRetries) {
            console.error(
                "AdSense interstitial API not available after max retries"
            );
            return;
        }

        if (!this._isInterstitialAPIReady()) {
            const delay = retryCount < 2 ? 500 : 1000;
            setTimeout(() => {
                this._showPrerollWithRetry(showFn, retryCount + 1, maxRetries);
            }, delay);
            return;
        }

        // Try to show preroll
        try {
            showFn();
        } catch (e) {
            if (
                e.message &&
                (e.message.includes("no interstitial API") ||
                    e.message.includes("interstitial"))
            ) {
                const delay = retryCount < 2 ? 1000 : 2000;
                setTimeout(() => {
                    this._showPrerollWithRetry(
                        showFn,
                        retryCount + 1,
                        maxRetries
                    );
                }, delay);
            } else {
                console.error("Preroll trigger failed:", e);
            }
        }
    },

    /**
     * Internal method to show preroll ad (for automatic triggers)
     */
    _internalShowPreroll() {
        if (!window.adsbygoogle) {
            window.adsbygoogle = [];
        }

        const showFn = () => {
            window.adsbygoogle.push({
                type: "preroll",
                adBreakDone: () => {
                    console.log("Preroll completed");
                    // Update tracking data
                    const tracking = this.getAdTracking();
                    const newPrerollCount = (tracking?.prerollCount || 0) + 1;
                    const newTotalPrerollCount =
                        (tracking?.totalPrerollCount || 0) + 1;

                    this.updateAdTracking({
                        prerollCount: newPrerollCount,
                        totalPrerollCount: newTotalPrerollCount,
                        missedVignetteCount: 0, // Reset missed count
                        currentCycle: "preroll",
                    });

                    // Check if preroll threshold reached, enter vignette cycle
                    const config = this.getVignetteConfig();
                    if (
                        config &&
                        newPrerollCount >= config.prerollToVignette.count &&
                        config.prerollToVignette.count > 0
                    ) {
                        // Reset counts, enter vignette cycle
                        this.updateAdTracking({
                            vignetteCount: 0,
                            prerollCount: 0,
                            currentCycle: "vignette",
                        });
                        console.log(
                            "Preroll cycle done, entering vignette cycle"
                        );
                    }
                },
            });
            console.log("Preroll triggered");
        };

        // Use retry mechanism
        this._showPrerollWithRetry(showFn);
    },

    /**
     * Manually show preroll ad
     * @param {Object} options - Preroll ad options
     * @param {Function} options.beforeAd - Callback before ad shows
     * @param {Function} options.adDismissed - Callback when ad dismissed
     * @param {Function} options.adViewed - Callback when ad viewed
     * @param {Function} options.afterAd - Callback after ad (only if ad shown)
     * @param {Function} options.adBreakDone - Callback when ad break done (always called)
     */
    showPreroll(options = {}) {
        if (!window.adsbygoogle) {
            window.adsbygoogle = [];
        }

        // Callback functions
        const beforeAd = options.beforeAd;
        const adDismissed = options.adDismissed;
        const adViewed = options.adViewed;
        const afterAd = options.afterAd;
        const adBreakDone = options.adBreakDone;

        const showFn = () => {
            const prerollOption = {
                type: "preroll",
                beforeAd: () => {
                    console.log("Preroll ad - beforeAd");
                    if (beforeAd) {
                        beforeAd();
                    }
                },
                adDismissed: () => {
                    console.log("Preroll ad - adDismissed");
                    if (adDismissed) {
                        adDismissed();
                    }
                },
                adViewed: () => {
                    console.log("Preroll ad - adViewed");
                    if (adViewed) {
                        adViewed();
                    }
                },
                afterAd: () => {
                    console.log("Preroll ad - afterAd (only if ad shown)");
                    if (afterAd) {
                        afterAd();
                    }
                },
                adBreakDone: () => {
                    console.log("Preroll ad - adBreakDone (always called)");
                    // Update tracking data
                    const tracking = this.getAdTracking();
                    const newPrerollCount = (tracking?.prerollCount || 0) + 1;
                    const newTotalPrerollCount =
                        (tracking?.totalPrerollCount || 0) + 1;

                    this.updateAdTracking({
                        prerollCount: newPrerollCount,
                        totalPrerollCount: newTotalPrerollCount,
                        missedVignetteCount: 0,
                        currentCycle: "preroll",
                    });

                    // Check if preroll threshold reached, enter vignette cycle
                    const config = this.getVignetteConfig();
                    if (
                        config &&
                        newPrerollCount >= config.prerollToVignette.count &&
                        config.prerollToVignette.count > 0
                    ) {
                        this.updateAdTracking({
                            vignetteCount: 0,
                            prerollCount: 0,
                            currentCycle: "vignette",
                        });
                        console.log(
                            "Preroll cycle done, entering vignette cycle"
                        );
                    }

                    if (adBreakDone) {
                        adBreakDone();
                    }
                },
            };

            window.adsbygoogle.push(prerollOption);
            console.log("Preroll ad triggered");
        };

        // Use retry mechanism
        this._showPrerollWithRetry(showFn);
    },

    /**
     * Trigger preroll cycle (by count)
     * @param {number} count - Number of prerolls to trigger
     * @param {number} current - Current triggered count
     */
    triggerPrerollCycle(count, current) {
        if (current >= count) {
            console.log(`Preroll cycle completed: ${count} triggered`);
            return;
        }

        // Save current preroll count to detect completion
        const tracking = this.getAdTracking();
        const beforePrerollCount = tracking?.prerollCount || 0;

        // Trigger preroll
        this._internalShowPreroll();

        // Wait for preroll completion (polling count changes)
        const checkInterval = setInterval(() => {
            const newTracking = this.getAdTracking();
            const newPrerollCount = newTracking?.prerollCount || 0;

            // If count increased, ad completed
            if (newPrerollCount > beforePrerollCount) {
                clearInterval(checkInterval);
                // Continue to next
                setTimeout(() => {
                    this.triggerPrerollCycle(count, newPrerollCount);
                }, 500);
            }
        }, 500);

        // Timeout protection: continue next if not completed in 30s
        setTimeout(() => {
            clearInterval(checkInterval);
            const newTracking = this.getAdTracking();
            const newPrerollCount = newTracking?.prerollCount || 0;
            if (newPrerollCount === beforePrerollCount) {
                // Count unchanged, ad may have failed, continue next
                console.warn("Preroll may not completed, continuing");
                this.triggerPrerollCycle(count, current + 1);
            } else {
                // Count changed, continue next
                this.triggerPrerollCycle(count, newPrerollCount);
            }
        }, 30000);
    },

    /**
     * Setup initial preroll (delayed trigger after page load, one-time only)
     */
    setupInitialPreroll() {
        const config = this.getVignetteConfig();
        if (!config || config.initialPrerollDelay <= 0) {
            return;
        }

        // Check if already triggered
        const storageKey = "c3_adsense_initial_preroll_triggered";
        const hasTriggered = sessionStorage.getItem(storageKey);

        if (hasTriggered === "true") {
            console.log("Initial preroll already triggered, skipping");
            return;
        }

        // Setup timer, delayed trigger
        this.initialPrerollTimer = setTimeout(() => {
            // Check again (prevent duplicate)
            if (sessionStorage.getItem(storageKey) === "true") {
                return;
            }

            // Mark as triggered
            sessionStorage.setItem(storageKey, "true");

            // Trigger preroll
            console.log(
                `Initial preroll triggered after ${config.initialPrerollDelay}s`
            );
            this._internalShowPreroll();
        }, config.initialPrerollDelay * 1000);
    },

    /**
     * Setup initial reward (delayed trigger after page load, one-time only)
     */
    setupInitialReward() {
        const config = this.config.adsenseConfig || {};
        const rewardConfig = config.rewardConfig || {};
        if (!rewardConfig || rewardConfig.initialRewardDelay <= 0) {
            return;
        }

        // Check if already triggered
        const storageKey = "c3_adsense_initial_reward_triggered";
        const hasTriggered = sessionStorage.getItem(storageKey);

        if (hasTriggered === "true") {
            console.log("Initial reward already triggered, skipping");
            return;
        }

        // Setup timer, delayed trigger
        this.initialRewardTimer = setTimeout(() => {
            // Check again (prevent duplicate)
            if (sessionStorage.getItem(storageKey) === "true") {
                return;
            }

            // Mark as triggered
            sessionStorage.setItem(storageKey, "true");

            // Trigger reward
            console.log(
                `Initial reward triggered after ${rewardConfig.initialRewardDelay}s`
            );
            this.showReward();
        }, rewardConfig.initialRewardDelay * 1000);
    },

    /**
     * Cleanup hashchange listener
     */
    cleanup() {
        if (this.hashChangeHandler) {
            window.removeEventListener("hashchange", this.hashChangeHandler);
            this.hashChangeHandler = null;
        }

        if (this.vignetteCheckInterval) {
            clearInterval(this.vignetteCheckInterval);
            this.vignetteCheckInterval = null;
        }

        if (this.initialPrerollTimer) {
            clearTimeout(this.initialPrerollTimer);
            this.initialPrerollTimer = null;
        }

        if (this.initialRewardTimer) {
            clearTimeout(this.initialRewardTimer);
            this.initialRewardTimer = null;
        }
    },

    /**
     * Create ad unit
     * @param {Object} options - Ad options
     * @param {string} options.adSlotId - Ad slot ID
     * @param {string} options.adFormat - Ad format (auto, responsive, rectangle, etc.)
     * @param {boolean} options.fullWidthResponsive - Full width responsive
     * @param {string} options.containerId - Container ID
     * @param {boolean} options.lazyLoad - Enable lazy load (default: false)
     * @param {number} options.autoRefreshSeconds - Auto refresh seconds (0 = disabled)
     * @param {number|string} options.width - Ad width (number or string, e.g., 300 or "300px")
     * @param {number|string} options.height - Ad height (number or string, e.g., 250 or "250px")
     * @param {string} options.display - Display type ("block", "inline-block", "inline"), default "inline-block"
     * @returns {Object} Ad object
     */
    createAd(options = {}) {
        if (!this.config) {
            throw new Error("AdSense not initialized, call c3.init() first");
        }

        const {
            adSlotId,
            adFormat = "auto",
            fullWidthResponsive = true,
            containerId,
            lazyLoad = false,
            autoRefreshSeconds = 0,
            width,
            height,
            display = "inline-block",
        } = options;

        if (!adSlotId) {
            throw new Error("adSlotId is required");
        }

        const container = containerId
            ? document.getElementById(containerId)
            : document.body;

        if (!container) {
            throw new Error(`Container not found: ${containerId || "body"}`);
        }

        // Create ins element
        const ins = document.createElement("ins");
        ins.className = "adsbygoogle";
        ins.style.display = display;

        // Set ad width and height
        if (width !== undefined) {
            if (typeof width === "number") {
                ins.style.width = `${width}px`;
            } else {
                ins.style.width = width;
            }
        } else {
            // Default 100% if width not specified
            ins.style.width = "100%";
        }

        if (height !== undefined) {
            if (typeof height === "number") {
                ins.style.height = `${height}px`;
            } else {
                ins.style.height = height;
            }
        }

        // Set ad attributes
        ins.setAttribute("data-ad-client", this.pubId);
        ins.setAttribute("data-ad-slot", adSlotId);

        if (fullWidthResponsive) {
            ins.setAttribute("data-full-width-responsive", "true");
            ins.setAttribute("data-ad-format", adFormat);
        }

        // Append to container
        container.appendChild(ins);

        // Generate unique ad ID
        const adId = `c3_ad_${Date.now()}_${++this.adCounter}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

        // Helper function to create ad element
        const createAdElement = () => {
            const newIns = document.createElement("ins");
            newIns.className = "adsbygoogle";
            newIns.style.display = display;

            // Set ad width and height
            if (width !== undefined) {
                if (typeof width === "number") {
                    newIns.style.width = `${width}px`;
                } else {
                    newIns.style.width = width;
                }
            } else {
                newIns.style.width = "100%";
            }

            if (height !== undefined) {
                if (typeof height === "number") {
                    newIns.style.height = `${height}px`;
                } else {
                    newIns.style.height = height;
                }
            }

            // Set ad attributes
            newIns.setAttribute("data-ad-client", this.pubId);
            newIns.setAttribute("data-ad-slot", adSlotId);

            if (fullWidthResponsive) {
                newIns.setAttribute("data-full-width-responsive", "true");
                newIns.setAttribute("data-ad-format", adFormat);
            }

            return newIns;
        };

        // Load ad function
        const loadAd = () => {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error("AdSense push failed:", e);
            }
        };

        // Refresh ad function - remove old element and create new one
        const refreshAd = () => {
            try {
                // Find ad object by unique ID (not adSlotId, as multiple ads can have same adSlotId)
                const adIndex = this.ads.findIndex((a) => a.id === adId);
                if (adIndex === -1) {
                    console.warn("Ad not found, cannot refresh");
                    return;
                }

                const currentAd = this.ads[adIndex];
                const currentElement = currentAd.element;

                // Get parent container
                if (!currentElement || !currentElement.parentNode) {
                    console.warn("Ad element has no parent, cannot refresh");
                    return;
                }

                const parent = currentElement.parentNode;

                // Remove old element
                parent.removeChild(currentElement);

                // Create new element with same attributes
                const newIns = createAdElement();

                // Replace in DOM
                parent.appendChild(newIns);

                // Update reference
                currentAd.element = newIns;

                // Disconnect old observer if exists
                if (currentAd.observer) {
                    currentAd.observer.disconnect();
                    currentAd.observer = null;
                }

                // Re-observe if lazy load was enabled
                if (lazyLoad) {
                    currentAd.observer = lazyLoadAd(newIns, loadAd, {
                        rootMargin: "50px",
                    });
                } else {
                    // Load new ad
                    loadAd();
                }
            } catch (e) {
                console.error("AdSense refresh failed:", e);
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
            id: adId, // Unique ad ID
            element: ins,
            adSlotId,
            containerId: containerId || "body",
            lazyLoad,
            autoRefreshSeconds,
            refreshTimer,
            observer,
            // Store ad config for refresh
            adFormat,
            fullWidthResponsive,
            width,
            height,
            display,
            container,
            refreshAd, // Store refresh function
        };

        this.ads.push(adObject);
        return adObject;
    },

    /**
     * Preload ads
     */
    preload() {
        if (this.config && this.config.preloadAd) {
            window.adsbygoogle = window.adsbygoogle || [];
            // AdSense handles preload automatically
            window.adsbygoogle.push({
                sound: "on",
                preloadAdBreaks: "on",
            });
        }
    },

    /**
     * Refresh ad
     * @param {string|Object} identifier - Ad slot ID, ad ID, or ad object
     */
    refresh(identifier) {
        if (!identifier) {
            // Refresh all ads
            this.ads.forEach((ad) => {
                if (ad.refreshAd && typeof ad.refreshAd === "function") {
                    ad.refreshAd();
                } else {
                    // Fallback: recreate ad element
                    this._recreateAd(ad);
                }
            });
        } else if (typeof identifier === "object" && identifier.id) {
            // Refresh specific ad by ad object
            const ad = this.ads.find((a) => a.id === identifier.id);
            if (ad) {
                if (ad.refreshAd && typeof ad.refreshAd === "function") {
                    ad.refreshAd();
                } else {
                    this._recreateAd(ad);
                }
            }
        } else if (typeof identifier === "string") {
            // Check if it's an ad ID (starts with c3_ad_)
            if (identifier.startsWith("c3_ad_")) {
                // Refresh by unique ad ID
                const ad = this.ads.find((a) => a.id === identifier);
                if (ad) {
                    if (ad.refreshAd && typeof ad.refreshAd === "function") {
                        ad.refreshAd();
                    } else {
                        this._recreateAd(ad);
                    }
                }
            } else {
                // Refresh all ads with matching adSlotId (multiple ads can have same adSlotId)
                const matchingAds = this.ads.filter(
                    (a) => a.adSlotId === identifier
                );
                matchingAds.forEach((ad) => {
                    if (ad.refreshAd && typeof ad.refreshAd === "function") {
                        ad.refreshAd();
                    } else {
                        this._recreateAd(ad);
                    }
                });
            }
        }
    },

    /**
     * Recreate ad element (internal helper)
     * @param {Object} ad - Ad object
     */
    _recreateAd(ad) {
        if (!ad.element || !ad.element.parentNode) {
            console.warn("Ad element not found, cannot refresh");
            return;
        }

        try {
            const parent = ad.element.parentNode;
            const container = ad.container || parent;

            // Remove old element
            parent.removeChild(ad.element);

            // Create new element
            const newIns = document.createElement("ins");
            newIns.className = "adsbygoogle";
            newIns.style.display = ad.display || "inline-block";

            // Set width
            if (ad.width !== undefined) {
                if (typeof ad.width === "number") {
                    newIns.style.width = `${ad.width}px`;
                } else {
                    newIns.style.width = ad.width;
                }
            } else {
                newIns.style.width = "100%";
            }

            // Set height
            if (ad.height !== undefined) {
                if (typeof ad.height === "number") {
                    newIns.style.height = `${ad.height}px`;
                } else {
                    newIns.style.height = ad.height;
                }
            }

            // Set attributes
            newIns.setAttribute("data-ad-client", this.pubId);
            newIns.setAttribute("data-ad-slot", ad.adSlotId);

            if (ad.fullWidthResponsive) {
                newIns.setAttribute("data-full-width-responsive", "true");
                newIns.setAttribute("data-ad-format", ad.adFormat || "auto");
            }

            // Append to container
            container.appendChild(newIns);

            // Update reference
            ad.element = newIns;

            // Disconnect old observer
            if (ad.observer) {
                ad.observer.disconnect();
                ad.observer = null;
            }

            // Re-observe if lazy load was enabled
            if (ad.lazyLoad) {
                const loadAd = () => {
                    try {
                        (window.adsbygoogle = window.adsbygoogle || []).push(
                            {}
                        );
                    } catch (e) {
                        console.error("AdSense push failed:", e);
                    }
                };
                ad.observer = lazyLoadAd(newIns, loadAd, {
                    rootMargin: "50px",
                });
            } else {
                // Load immediately
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error("AdSense refresh failed:", e);
        }
    },

    /**
     * Remove ad
     * @param {string} adSlotId - Ad slot ID
     */
    remove(adSlotId) {
        const index = this.ads.findIndex((a) => a.adSlotId === adSlotId);
        if (index !== -1) {
            const ad = this.ads[index];

            // Clear auto refresh timer
            if (ad.refreshTimer) {
                clearAutoRefresh(ad.refreshTimer);
            }

            // Disconnect Observer
            if (ad.observer) {
                ad.observer.disconnect();
            }

            // Remove DOM element
            if (ad.element && ad.element.parentNode) {
                ad.element.parentNode.removeChild(ad.element);
            }

            this.ads.splice(index, 1);
        }
    },

    /**
     * Manually trigger preroll (alias for showPreroll)
     * @param {Object} options - Preroll ad options
     */
    triggerPreroll(options = {}) {
        this.showPreroll(options);
    },

    /**
     * Manually trigger reward ad
     * @param {Object} options - Reward ad options
     * @param {string} options.name - Reward ad name
     * @param {Function} options.beforeAd - Callback before ad shows
     * @param {Function} options.beforeReward - Callback before reward (receives showAdFn)
     * @param {Function} options.adDismissed - Callback when ad dismissed
     * @param {Function} options.adViewed - Callback when ad viewed
     * @param {Function} options.afterAd - Callback after ad (only if ad shown)
     * @param {Function} options.adBreakDone - Callback when ad break done (always called)
     */
    showReward(options = {}) {
        if (!window.adsbygoogle) {
            window.adsbygoogle = [];
        }

        const config = this.config.adsenseConfig || {};
        const rewardConfig = config.rewardConfig || {};

        // Get config or use passed options
        const rewardName = options.name || rewardConfig.name || "c3_reward";

        // Callback functions
        const beforeAd = options.beforeAd || rewardConfig.beforeAd;
        const beforeReward = options.beforeReward || rewardConfig.beforeReward;
        const adDismissed = options.adDismissed || rewardConfig.adDismissed;
        const adViewed = options.adViewed || rewardConfig.adViewed;
        const afterAd = options.afterAd || rewardConfig.afterAd;
        const adBreakDone = options.adBreakDone || rewardConfig.adBreakDone;

        try {
            const afgOption = {
                type: "reward",
                name: rewardName,
                beforeAd: () => {
                    console.log("Reward ad - beforeAd");
                    if (beforeAd) {
                        beforeAd();
                    }
                },
                beforeReward: (showAdFn) => {
                    console.log("Reward ad - beforeReward");
                    if (beforeReward) {
                        beforeReward(showAdFn);
                    } else if (showAdFn) {
                        // Default call showAdFn if no callback provided
                        showAdFn();
                    }
                },
                adDismissed: () => {
                    console.log("Reward ad - adDismissed");
                    if (adDismissed) {
                        adDismissed();
                    }
                },
                adViewed: () => {
                    console.log("Reward ad - adViewed");
                    if (adViewed) {
                        adViewed();
                    }
                },
                afterAd: () => {
                    console.log("Reward ad - afterAd (only if ad shown)");
                    if (afterAd) {
                        afterAd();
                    }
                },
                adBreakDone: () => {
                    console.log("Reward ad - adBreakDone (always called)");
                    if (adBreakDone) {
                        adBreakDone();
                    }
                },
            };

            window.adsbygoogle.push(afgOption);
            console.log("Reward ad triggered:", rewardName);
        } catch (e) {
            console.error("Reward ad trigger failed:", e);
        }
    },

    /**
     * Get ad tracking stats
     */
    getAdTrackingStats() {
        return this.getAdTracking();
    },

    /**
     * Reset ad tracking data
     */
    resetAdTracking() {
        const storageKey = "c3_adsense_ad_tracking";
        sessionStorage.removeItem(storageKey);
        this.initAdTracking();
    },

    /**
     * Reset initial preroll flag (allow trigger again)
     */
    resetInitialPreroll() {
        const storageKey = "c3_adsense_initial_preroll_triggered";
        sessionStorage.removeItem(storageKey);
    },

    /**
     * Reset initial reward flag (allow trigger again)
     */
    resetInitialReward() {
        const storageKey = "c3_adsense_initial_reward_triggered";
        sessionStorage.removeItem(storageKey);
    },

    /**
     * Manually trigger reward ad (alias for showReward)
     */
    triggerReward(options = {}) {
        this.showReward(options);
    },

    /**
     * Get all ads
     */
    getAds() {
        return this.ads;
    },
};
