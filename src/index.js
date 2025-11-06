import { init } from "./core/init";
import { AdSense } from "./platforms/adsense";
import { GPT } from "./platforms/gpt";
import { AFS } from "./platforms/afs";

/**
 * C3 SDK main object
 */
const C3 = {
    /**
     * Initialize SDK
     * @param {Object} config - Configuration object
     * @param {string} config.platform - Platform type: "ads" | "gpt" | "afs"
     * @param {string} config.pubId - Publisher ID
     * @param {boolean} config.nativeAfgSupport - Enable native ads support
     * @param {string} config.channelId - Channel ID
     * @param {boolean} config.useGa - Enable Google Analytics
     * @param {boolean} config.useGtm - Enable Google Tag Manager
     * @param {boolean} config.preloadAd - Preload ads
     * @param {Object} config.adsenseConfig - AdSense extra config
     * @param {Object} config.gptConfig - GPT extra config
     * @param {Object} config.afsConfig - AFS extra config
     */
    init: init,

    /**
     * AdSense methods
     */
    AdSense: AdSense,

    /**
     * GPT methods
     */
    GPT: GPT,

    /**
     * AFS methods
     */
    AFS: AFS,

    /**
     * SDK version
     */
    version: "1.0.6",
};

// Mount C3 to global object in browser environment
if (typeof window !== "undefined") {
    window.c3 = C3;
}

// Export for module usage
export default C3;
