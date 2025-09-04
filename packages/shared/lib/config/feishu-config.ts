export type FeishuAppInfo = {
  appId?: string;
  appSecret?: string;
  appToken?: string;
  tableId?: string;
};

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

  async getAppInfo(): Promise<FeishuAppInfo> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const { appId, appSecret, appToken, tableId } = await chrome.storage.local.get([
          'appId',
          'appSecret',
          'appToken',
          'tableId',
        ]);
        return {
          appId: appId?.trim(),
          appSecret: appSecret?.trim(),
          appToken: appToken?.trim(),
          tableId: tableId?.trim(),
        };
      }
    } catch (error) {
      console.warn('获取本地存储的AppInfo失败:', error);
    }
    return {};
  },

  /**
   * 异步设置飞书应用ID
   * 保存到本地存储
   */
  async setAppInfo(appInfo: FeishuAppInfo): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set(appInfo);
      }
    } catch (error) {
      console.error('保存AppInfo到本地存储失败:', error);
      throw error;
    }
  },

  async clearAppInfo(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(['appId', 'appSecret', 'appToken', 'tableId']);
      }
    } catch (error) {
      console.error('清除AppInfo本地存储失败:', error);
      throw error;
    }
  },
};
