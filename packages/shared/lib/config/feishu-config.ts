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

  /**
   * 异步获取多维表格Token
   * 从本地存储获取用户设置的值
   */
  async getAppToken(): Promise<string> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const { app_token } = await chrome.storage.local.get('app_token');
        if (app_token && app_token.trim()) {
          return app_token.trim();
        }
      }
    } catch (error) {
      console.warn('获取本地存储的AppToken失败:', error);
    }
    return '';
  },

  /**
   * 异步获取多维表格ID
   * 从本地存储获取用户设置的值
   */
  async getTableId(): Promise<string> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const { table_id } = await chrome.storage.local.get('table_id');
        if (table_id && table_id.trim()) {
          return table_id.trim();
        }
      }
    } catch (error) {
      console.warn('获取本地存储的TableId失败:', error);
    }
    return '';
  },

  /**
   * 异步设置飞书应用ID
   * 保存到本地存储
   */
  async setAppId(appId: string): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ feishuAppId: appId.trim() });
      }
    } catch (error) {
      console.error('保存AppID到本地存储失败:', error);
      throw error;
    }
  },

  /**
   * 异步设置飞书应用密钥
   * 保存到本地存储
   */
  async setAppSecret(appSecret: string): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ feishuAppSecret: appSecret.trim() });
      }
    } catch (error) {
      console.error('保存AppSecret到本地存储失败:', error);
      throw error;
    }
  },

  /**
   * 异步设置多维表格Token
   * 保存到本地存储
   */
  async setAppToken(appToken: string): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ app_token: appToken.trim() });
      }
    } catch (error) {
      console.error('保存AppToken到本地存储失败:', error);
      throw error;
    }
  },

  /**
   * 异步设置多维表格ID
   * 保存到本地存储
   */
  async setTableId(tableId: string): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ table_id: tableId.trim() });
      }
    } catch (error) {
      console.error('保存TableId到本地存储失败:', error);
      throw error;
    }
  },
};
