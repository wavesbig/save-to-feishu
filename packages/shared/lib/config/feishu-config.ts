/**
 * 飞书应用配置
 */
export const FEISHU_CONFIG = {
  // 飞书应用ID，需要在飞书开放平台创建应用后获取
  APP_ID: process.env.CEB_FEISHU_APP_ID || '',

  // 飞书应用密钥，需要在飞书开放平台创建应用后获取
  APP_SECRET: process.env.CEB_FEISHU_APP_SECRET || '',

  // 授权回调地址，需要在飞书开放平台配置
  get REDIRECT_URI() {
    // 在运行时获取chrome对象，避免构建时错误
    return typeof chrome !== 'undefined' && chrome.runtime
      ? chrome.runtime.getURL('options/index.html')
      : 'chrome-extension://[id]/options/index.html';
  },

  // 飞书API基础URL
  API_BASE_URL: 'https://open.feishu.cn/open-apis',
};
