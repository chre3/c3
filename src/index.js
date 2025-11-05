import { init } from './core/init';
import { AdSense } from './platforms/adsense';
import { GPT } from './platforms/gpt';
import { AFS } from './platforms/afs';

/**
 * C3 SDK 主对象
 */
const C3 = {
  /**
   * 初始化 SDK
   * @param {Object} config - 配置对象
   * @param {string} config.platform - 平台类型: "ads" | "gpt" | "afs"
   * @param {string} config.pubId - 发布商 ID
   * @param {boolean} config.nativeAfgSupport - 是否支持原生广告
   * @param {string} config.channelId - 频道 ID
   * @param {boolean} config.useGa - 是否使用 Google Analytics
   * @param {boolean} config.useGtm - 是否使用 Google Tag Manager
   * @param {boolean} config.preloadAd - 是否预加载广告
   * @param {Object} config.adsenseConfig - AdSense 额外配置
   * @param {Object} config.gptConfig - GPT 额外配置
   * @param {Object} config.afsConfig - AFS 额外配置
   */
  init: init,

  /**
   * AdSense 相关方法
   */
  AdSense: AdSense,

  /**
   * GPT 相关方法
   */
  GPT: GPT,

  /**
   * AFS 相关方法
   */
  AFS: AFS,

  /**
   * SDK 版本
   */
  version: '1.0.0'
};

// 如果在浏览器环境中，将 C3 挂载到全局对象
if (typeof window !== 'undefined') {
  window.c3 = C3;
}

// 导出供模块化使用
export default C3;

