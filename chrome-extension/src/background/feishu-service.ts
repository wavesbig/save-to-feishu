/**
 * 飞书服务 - 背景脚本
 * 处理飞书授权和API调用
 */
import { FEISHU_CONFIG } from '@extension/shared';

// 授权状态
let accessToken: string | null = null;
let refreshToken: string | null = null;
let userId: string | null = null;

// 初始化时从存储中加载令牌
chrome.runtime.onInstalled.addListener(async () => {
  const {
    accessToken: storedToken,
    refreshToken: storedRefresh,
    userId: storedUserId,
  } = await chrome.storage.local.get(['accessToken', 'refreshToken', 'userId']);

  accessToken = storedToken || null;
  refreshToken = storedRefresh || null;
  userId = storedUserId || null;
});

/**
 * 启动飞书授权流程
 */
const startFeishuAuth = async () => {
  // 确保APP_ID不为空
  if (!FEISHU_CONFIG.APP_ID) {
    console.error('飞书APP_ID未配置');
    return { success: false, error: '飞书APP_ID未配置，请在.env文件中设置CEB_FEISHU_APP_ID' };
  }

  const authUrl = `${FEISHU_CONFIG.API_BASE_URL}/authen/v1/index?app_id=${FEISHU_CONFIG.APP_ID}&redirect_uri=${encodeURIComponent(FEISHU_CONFIG.REDIRECT_URI)}&response_type=code`;

  try {
    // 使用Chrome身份API打开授权窗口
    const authResult = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });

    if (authResult) {
      // 从回调URL中提取授权码
      const url = new URL(authResult);
      const code = url.searchParams.get('code');

      if (code) {
        // 使用授权码获取访问令牌
        return await getAccessToken(code);
      }
    }
    return { success: false, error: '授权失败' };
  } catch (error) {
    console.error('飞书授权流程错误:', error);
    return { success: false, error: '授权流程出错' };
  }
};

/**
 * 使用授权码获取访问令牌
 */
const getAccessToken = async (code: string) => {
  // 确保APP_ID和APP_SECRET不为空
  if (!FEISHU_CONFIG.APP_ID || !FEISHU_CONFIG.APP_SECRET) {
    console.error('飞书APP_ID或APP_SECRET未配置');
    return { success: false, error: '飞书应用配置不完整，请在.env文件中设置CEB_FEISHU_APP_ID和CEB_FEISHU_APP_SECRET' };
  }

  try {
    const response = await fetch(`${FEISHU_CONFIG.API_BASE_URL}/authen/v1/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: FEISHU_CONFIG.APP_ID,
        app_secret: FEISHU_CONFIG.APP_SECRET,
        grant_type: 'authorization_code',
        code,
      }),
    });

    const data = await response.json();

    if (data.code === 0 && data.data) {
      // 保存令牌
      accessToken = data.data.access_token;
      refreshToken = data.data.refresh_token;
      userId = data.data.user_id;

      // 存储令牌
      await chrome.storage.local.set({
        accessToken,
        refreshToken,
        userId,
      });

      return { success: true };
    } else {
      console.error('获取访问令牌失败:', data);
      return { success: false, error: data.msg || '获取访问令牌失败' };
    }
  } catch (error) {
    console.error('获取访问令牌出错:', error);
    return { success: false, error: '获取访问令牌出错' };
  }
};

/**
 * 刷新访问令牌
 */
const refreshAccessToken = async () => {
  if (!refreshToken) {
    return { success: false, error: '没有刷新令牌' };
  }

  // 确保APP_ID和APP_SECRET不为空
  if (!FEISHU_CONFIG.APP_ID || !FEISHU_CONFIG.APP_SECRET) {
    console.error('飞书APP_ID或APP_SECRET未配置');
    return { success: false, error: '飞书应用配置不完整，请在.env文件中设置CEB_FEISHU_APP_ID和CEB_FEISHU_APP_SECRET' };
  }

  try {
    const response = await fetch(`${FEISHU_CONFIG.API_BASE_URL}/authen/v1/refresh_access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: FEISHU_CONFIG.APP_ID,
        app_secret: FEISHU_CONFIG.APP_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (data.code === 0 && data.data) {
      // 更新令牌
      accessToken = data.data.access_token;
      refreshToken = data.data.refresh_token;

      // 存储令牌
      await chrome.storage.local.set({
        accessToken,
        refreshToken,
      });

      return { success: true };
    } else {
      console.error('刷新访问令牌失败:', data);
      return { success: false, error: data.msg || '刷新访问令牌失败' };
    }
  } catch (error) {
    console.error('刷新访问令牌出错:', error);
    return { success: false, error: '刷新访问令牌出错' };
  }
};

/**
 * 发送API请求
 */
const sendApiRequest = async (
  endpoint: string,
  method: string = 'GET',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any,
) => {
  // 检查是否有访问令牌
  if (!accessToken) {
    // 尝试刷新令牌
    if (refreshToken) {
      const refreshResult = await refreshAccessToken();
      if (!refreshResult.success) {
        return { success: false, error: '未授权或令牌已过期' };
      }
    } else {
      return { success: false, error: '未授权' };
    }
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${FEISHU_CONFIG.API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    // 处理令牌过期情况
    if (data.code === 99991663) {
      const refreshResult = await refreshAccessToken();
      if (refreshResult.success) {
        // 重试请求
        return sendApiRequest(endpoint, method, body);
      } else {
        return { success: false, error: '令牌已过期且无法刷新' };
      }
    }

    return { success: data.code === 0, data: data.data, error: data.msg };
  } catch (error) {
    console.error('API请求失败:', error);
    return { success: false, error: '请求失败' };
  }
};

/**
 * 获取当前用户信息
 */
const getCurrentUser = async () => await sendApiRequest('/authen/v1/user_info');

/**
 * 获取用户的文档列表
 */
const getDocuments = async () => await sendApiRequest('/drive/v1/recent_used_docs');

/**
 * 获取用户的知识库列表
 */
const getWikis = async () => await sendApiRequest('/wiki/v2/spaces');

/**
 * 获取用户的便签列表
 */
const getNotes = async () => await sendApiRequest('/bitable/v1/apps/notes');

/**
 * 创建文档
 */
const createDocument = async (title: string, url: string, content: string) =>
  await sendApiRequest('/doc/v2/create', 'POST', {
    title,
    content: `<p><a href="${url}">${url}</a></p><p>${content}</p>`,
  });

/**
 * 创建知识库文档
 */
const createWikiDocument = async (wikiId: string, title: string, url: string, content: string) =>
  await sendApiRequest(`/wiki/v2/spaces/${wikiId}/nodes`, 'POST', {
    title,
    obj_type: 'doc',
    content: `<p><a href="${url}">${url}</a></p><p>${content}</p>`,
  });

/**
 * 创建便签
 */
const createNote = async (title: string, url: string, content: string) =>
  await sendApiRequest('/bitable/v1/apps/notes', 'POST', {
    title,
    body: {
      content: `${url}\n\n${content}`,
    },
  });

/**
 * 保存内容到飞书
 */
const saveContent = async (data: {
  title: string;
  url: string;
  content: string;
  target: 'doc' | 'wiki' | 'note';
  targetId?: string;
  tags?: string[];
}) => {
  const { title, url, content, target, targetId, tags } = data;
  let result;

  switch (target) {
    case 'doc':
      result = await createDocument(title, url, content);
      break;
    case 'wiki':
      if (targetId) {
        result = await createWikiDocument(targetId, title, url, content);
      } else {
        return { success: false, error: '未指定知识库ID' };
      }
      break;
    case 'note':
      result = await createNote(title, url, content);
      break;
    default:
      return { success: false, error: '不支持的目标类型' };
  }

  if (result.success) {
    // 保存历史记录
    const { saveHistory = [] } = await chrome.storage.local.get('saveHistory');
    saveHistory.unshift({
      id: result.data.obj_token || result.data.node_token || result.data.note_id,
      title,
      url,
      target,
      targetId: targetId || result.data.obj_token || result.data.node_token || result.data.note_id,
      saveTime: Date.now(),
      tags: tags || [],
    });

    // 限制历史记录数量为50条
    if (saveHistory.length > 50) {
      saveHistory.pop();
    }

    await chrome.storage.local.set({ saveHistory });
  }

  return result;
};

/**
 * 退出登录
 */
const logout = async () => {
  accessToken = null;
  refreshToken = null;
  userId = null;

  await chrome.storage.local.remove(['accessToken', 'refreshToken', 'userId']);

  return { success: true };
};

// 监听来自内容脚本和弹出窗口的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'feishu_auth') {
    startFeishuAuth().then(sendResponse);
    return true; // 异步响应
  }

  if (message.action === 'feishu_get_user') {
    getCurrentUser().then(sendResponse);
    return true;
  }

  if (message.action === 'feishu_get_documents') {
    getDocuments().then(sendResponse);
    return true;
  }

  if (message.action === 'feishu_get_wikis') {
    getWikis().then(sendResponse);
    return true;
  }

  if (message.action === 'feishu_get_notes') {
    getNotes().then(sendResponse);
    return true;
  }

  if (message.action === 'feishu_save_content') {
    saveContent(message.data).then(sendResponse);
    return true;
  }

  if (message.action === 'feishu_logout') {
    logout().then(sendResponse);
    return true;
  }
});

// 导出函数供其他背景脚本使用
export { startFeishuAuth, getCurrentUser, getDocuments, getWikis, getNotes, saveContent, logout };
