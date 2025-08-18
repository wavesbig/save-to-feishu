/**
 * 飞书应用配置
 */
export const FEISHU_CONFIG = {
  // 授权回调地址，需要在飞书开放平台配置
  get REDIRECT_URI() {
    // 在运行时获取chrome对象，避免构建时错误
    return typeof chrome !== 'undefined' && chrome.runtime
      ? chrome.runtime.getURL('options/index.html')
      : 'chrome-extension://[id]/options/index.html';
  },

  // 飞书API基础URL
  API_BASE_URL: 'https://open.feishu.cn/open-apis',

  /**
   * 异步获取飞书应用ID
   * 从本地存储获取用户设置的值
   */
  async getAppId(): Promise<string> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const { feishuAppId } = await chrome.storage.local.get('feishuAppId');
        if (feishuAppId && feishuAppId.trim()) {
          return feishuAppId.trim();
        }
      }
    } catch (error) {
      console.warn('获取本地存储的AppID失败:', error);
    }
    return '';
  },

  /**
   * 异步获取飞书应用密钥
   * 从本地存储获取用户设置的值
   */
  async getAppSecret(): Promise<string> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const { feishuAppSecret } = await chrome.storage.local.get('feishuAppSecret');
        if (feishuAppSecret && feishuAppSecret.trim()) {
          return feishuAppSecret.trim();
        }
      }
    } catch (error) {
      console.warn('获取本地存储的AppSecret失败:', error);
    }
    return '';
  },
};
