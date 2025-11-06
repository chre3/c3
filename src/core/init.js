import { loadScript } from "./utils";
import { AdSense } from "../platforms/adsense";
import { GPT } from "../platforms/gpt";
import { AFS } from "../platforms/afs";

/**
 * Config storage
 */
let config = null;
let initialized = false;

/**
 * Initialize SDK
 * @param {Object} options - Configuration options
 * @returns {Promise} Promise that resolves when initialization completes
 */
export function init(options = {}) {
    if (initialized) {
        console.warn("C3 SDK already initialized");
        return Promise.resolve();
    }

    // Validate required parameters
    if (!options.platform) {
        return Promise.reject(new Error("platform is required"));
    }

    if (!options.pubId && options.platform !== "afs") {
        return Promise.reject(new Error("pubId is required"));
    }

    // Save config
    config = {
        platform: options.platform,
        pubId: options.pubId || "",
        nativeAfgSupport: options.nativeAfgSupport !== false,
        channelId: options.channelId || "",
        useGa: options.useGa || false,
        useGtm: options.useGtm || false,
        gaMeasurementId: options.gaMeasurementId || "",
        gtmContainerId: options.gtmContainerId || "",
        preloadAd: options.preloadAd !== false,
        adsenseConfig: {
            // Vignette/Preroll config (AdSense only)
            vignetteConfig: (options.adsenseConfig &&
                options.adsenseConfig.vignetteConfig) ||
                options.vignetteConfig || {
                    enabled: false, // Enable vignette/preroll management
                    vignetteToPreroll: {
                        // Vignette count before triggering preroll
                        count: 3, // Vignette threshold
                        trigger: 1, // Preroll trigger count
                    },
                    prerollToVignette: {
                        // Preroll count before triggering vignette
                        count: 1, // Preroll threshold
                        trigger: 3, // Vignette trigger count (AdSense controlled)
                    },
                    maxVignetteMissed: 2, // Max missed vignettes before preroll (fallback)
                    initialPrerollDelay: 0, // Initial preroll delay in seconds (0=disabled, one-time)
                },
            // Reward ad config
            rewardConfig: (options.adsenseConfig &&
                options.adsenseConfig.rewardConfig) || {
                name: "c3_reward", // Reward ad name
                initialRewardDelay: 0, // Initial reward delay in seconds (0=disabled, one-time)
            },
            // Other AdSense config (exclude processed keys)
            ...(options.adsenseConfig
                ? Object.keys(options.adsenseConfig)
                      .filter(
                          (key) =>
                              key !== "vignetteConfig" && key !== "rewardConfig"
                      )
                      .reduce((acc, key) => {
                          acc[key] = options.adsenseConfig[key];
                          return acc;
                      }, {})
                : {}),
        },
        gptConfig: options.gptConfig || {},
        afsConfig: options.afsConfig || {},
    };

    // Load Google Analytics or Google Tag Manager
    if (config.useGa) {
        if (!config.gaMeasurementId) {
            console.warn("useGa is true but gaMeasurementId is missing");
        } else {
            loadGoogleAnalytics(config.gaMeasurementId);
        }
    }

    if (config.useGtm) {
        if (!config.gtmContainerId) {
            console.warn("useGtm is true but gtmContainerId is missing");
        } else {
            loadGoogleTagManager(config.gtmContainerId);
        }
    }

    initialized = true;

    // Initialize platform and return Promise
    switch (config.platform) {
        case "ads":
            return initializeAdSense();
        case "gpt":
            return initializeGPT();
        case "afs":
            return initializeAFS();
        default:
            return Promise.reject(
                new Error(`Unsupported platform: ${config.platform}`)
            );
    }
}

/**
 * Initialize AdSense
 * @returns {Promise} Promise
 */
function initializeAdSense() {
    // Load AdSense script
    window.adsbygoogle = window.adsbygoogle || [];
    let scriptUrl =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
        config.pubId;
    let scriptOptions = {
        async: true,
        crossOrigin: "anonymous",
    };

    if (config.nativeAfgSupport) {
        scriptUrl =
            "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        scriptOptions = {
            async: true,
            hint: "10s",
            pubId: config.pubId,
        };
    }

    if (typeof window !== "undefined") {
        window.adBreak = window.adConfig = function (o) {
            window.adsbygoogle.push(o);
        };
    }

    return loadScript(scriptUrl, scriptOptions)
        .then(() => {
            AdSense.init(config);
            if (config.preloadAd) {
                AdSense.preload();
            }
            console.log("C3 SDK initialized", config);
            return Promise.resolve();
        })
        .catch((error) => {
            console.error("AdSense script load failed:", error);
            return Promise.reject(error);
        });
}

/**
 * Initialize GPT
 * @returns {Promise} Promise
 */
function initializeGPT() {
    // Load GPT script
    return loadScript("https://securepubads.g.doubleclick.net/tag/js/gpt.js", {
        async: true,
    })
        .then(() => {
            return new Promise((resolve) => {
                if (window.googletag && window.googletag.apiReady) {
                    GPT.init(config);

                    if (config.preloadAd) {
                        GPT.preload();
                    }
                    console.log("C3 SDK initialized", config);
                    resolve();
                } else {
                    // Wait for GPT ready
                    window.googletag = window.googletag || {};
                    window.googletag.cmd = window.googletag.cmd || [];
                    window.googletag.cmd.push(() => {
                        GPT.init(config);
                        if (config.preloadAd) {
                            GPT.preload();
                        }
                        console.log("C3 SDK initialized", config);
                        resolve();
                    });
                }
            });
        })
        .catch((error) => {
            console.error("GPT script load failed:", error);
            return Promise.reject(error);
        });
}

/**
 * Initialize AFS
 * @returns {Promise} Promise
 */
function initializeAFS() {
    // AFS needs AdSense script
    return loadScript("https://www.google.com/adsense/search/ads.js", {
        async: true,
        crossOrigin: "anonymous",
    })
        .then(() => {
            AFS.init(config);
            console.log("C3 SDK initialized", config);
            return Promise.resolve();
        })
        .catch((error) => {
            console.error("AFS script load failed:", error);
            return Promise.reject(error);
        });
}

/**
 * Load Google Analytics
 * @param {string} measurementId - GA Measurement ID (e.g., G-XXXXXXXXXX)
 */
function loadGoogleAnalytics(measurementId) {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag("js", new Date());

    // Load gtag.js script
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, {
        async: true,
    })
        .then(() => {
            // Configure GA
            gtag("config", measurementId);
            console.log("Google Analytics loaded");
        })
        .catch((error) => {
            console.error("Google Analytics script load failed:", error);
        });
}

/**
 * Load Google Tag Manager
 * @param {string} containerId - GTM Container ID (e.g., GTM-XXXXXX)
 */
function loadGoogleTagManager(containerId) {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        "gtm.start": new Date().getTime(),
        event: "gtm.js",
    });

    // Load GTM script
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${containerId}`, {
        async: true,
    })
        .then(() => {
            console.log("Google Tag Manager loaded");

            // Add noscript tag to body (if not exists)
            if (!document.getElementById("gtm-noscript")) {
                const noscript = document.createElement("noscript");
                noscript.id = "gtm-noscript";
                const iframe = document.createElement("iframe");
                iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
                iframe.height = "0";
                iframe.width = "0";
                iframe.style.display = "none";
                iframe.style.visibility = "hidden";
                noscript.appendChild(iframe);
                document.body.insertBefore(noscript, document.body.firstChild);
            }
        })
        .catch((error) => {
            console.error("Google Tag Manager script load failed:", error);
        });
}

/**
 * Get config
 */
export function getConfig() {
    return config;
}

/**
 * Check if initialized
 */
export function isInitialized() {
    return initialized;
}
