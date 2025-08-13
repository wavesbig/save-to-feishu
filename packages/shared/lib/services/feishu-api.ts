/**
 * 飞书API服务类
 * 封装与飞书开放平台的交互
 */
import type {
  FeishuDocument,
  FeishuNote,
  FeishuUser,
  FeishuWiki,
  SaveContent,
  SaveHistory,
  SaveTarget,
} from '../types/feishu.js';

// 飞书API基础URL
const FEISHU_API_BASE_URL = 'https://open.feishu.cn/open-apis';

// 飞书API响应类型
export interface FeishuApiResponse<T> {
  code: number;
  msg: string;
  data?: T;
}

/**
 * 飞书API服务类
 */
export class FeishuApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private userId: string | null = null;

  /**
   * 初始化服务
   */
  constructor() {
    this.loadTokens();
  }

  /**
   * 从存储中加载令牌
   */
  private async loadTokens() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const { accessToken, refreshToken, userId } = await chrome.storage.local.get([
          'accessToken',
          'refreshToken',
          'userId',
        ]);
        this.accessToken = accessToken || null;
        this.refreshToken = refreshToken || null;
        this.userId = userId || null;
      }
    } catch (error) {
      console.error('加载令牌失败:', error);
    }
  }

  /**
   * 保存令牌到存储
   */
  private async saveTokens() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          userId: this.userId,
        });
      }
    } catch (error) {
      console.error('保存令牌失败:', error);
    }
  }

  /**
   * 检查是否已授权
   */
  public isAuthorized(): boolean {
    return !!this.accessToken;
  }

  /**
   * 获取授权URL
   */
  public getAuthUrl(appId: string, redirectUri: string): string {
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    return `https://open.feishu.cn/open-apis/authen/v1/index?app_id=${appId}&redirect_uri=${encodedRedirectUri}&response_type=code`;
  }

  /**
   * 处理授权回调
   * @param code 授权码
   * @param appId 应用ID
   * @param appSecret 应用密钥
   */
  public async handleAuthCallback(code: string, appId: string, appSecret: string): Promise<boolean> {
    try {
      const response = await fetch(`${FEISHU_API_BASE_URL}/authen/v1/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          app_secret: appSecret,
          grant_type: 'authorization_code',
          code,
        }),
      });

      const data = await response.json();
      if (data.code === 0) {
        this.accessToken = data.data.access_token;
        this.refreshToken = data.data.refresh_token;
        this.userId = data.data.user_id;
        await this.saveTokens();
        return true;
      }
      return false;
    } catch (error) {
      console.error('授权回调处理失败:', error);
      return false;
    }
  }

  /**
   * 刷新访问令牌
   */
  private async refreshAccessToken(appId: string, appSecret: string): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${FEISHU_API_BASE_URL}/authen/v1/refresh_access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          app_secret: appSecret,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      const data = await response.json();
      if (data.code === 0) {
        this.accessToken = data.data.access_token;
        this.refreshToken = data.data.refresh_token;
        await this.saveTokens();
        return true;
      }
      return false;
    } catch (error) {
      console.error('刷新令牌失败:', error);
      return false;
    }
  }

  /**
   * 发送API请求
   */
  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any,
    appId?: string,
    appSecret?: string,
  ): Promise<FeishuApiResponse<T>> {
    if (!this.accessToken && appId && appSecret) {
      const refreshed = await this.refreshAccessToken(appId, appSecret);
      if (!refreshed) {
        return { code: 401, msg: '未授权或令牌已过期' };
      }
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${FEISHU_API_BASE_URL}${endpoint}`, options);
      const data = await response.json();

      // 处理令牌过期情况
      if (data.code === 99991663 && appId && appSecret) {
        const refreshed = await this.refreshAccessToken(appId, appSecret);
        if (refreshed) {
          return this.request(endpoint, method, body);
        }
      }

      return data;
    } catch (error) {
      console.error('API请求失败:', error);
      return { code: 500, msg: '请求失败' };
    }
  }

  /**
   * 获取当前用户信息
   */
  public async getCurrentUser(): Promise<FeishuUser | null> {
    const response = await this.request<{ user: FeishuUser }>('/authen/v1/user_info');
    return response.code === 0 && response.data ? response.data.user : null;
  }

  /**
   * 获取用户的文档列表
   */
  public async getDocuments(): Promise<FeishuDocument[]> {
    const response = await this.request<{ items: FeishuDocument[] }>('/drive/v1/recent_used_docs');
    return response.code === 0 && response.data ? response.data.items : [];
  }

  /**
   * 获取用户的知识库列表
   */
  public async getWikis(): Promise<FeishuWiki[]> {
    const response = await this.request<{ items: FeishuWiki[] }>('/wiki/v2/spaces');
    return response.code === 0 && response.data ? response.data.items : [];
  }

  /**
   * 获取用户的便签列表
   */
  public async getNotes(): Promise<FeishuNote[]> {
    const response = await this.request<{ notes: FeishuNote[] }>('/bitable/v1/apps/notes');
    return response.code === 0 && response.data ? response.data.notes : [];
  }

  /**
   * 创建文档
   */
  public async createDocument(content: SaveContent): Promise<string | null> {
    const response = await this.request<{ obj_token: string }>('/doc/v2/create', 'POST', {
      title: content.title,
      content: `<p>${content.url}</p><p>${content.content}</p>`,
    });
    return response.code === 0 && response.data ? response.data.obj_token : null;
  }

  /**
   * 创建知识库文档
   */
  public async createWikiDocument(wikiId: string, content: SaveContent): Promise<string | null> {
    const response = await this.request<{ node_token: string }>(`/wiki/v2/spaces/${wikiId}/nodes`, 'POST', {
      title: content.title,
      obj_type: 'doc',
      content: `<p>${content.url}</p><p>${content.content}</p>`,
    });
    return response.code === 0 && response.data ? response.data.node_token : null;
  }

  /**
   * 创建便签
   */
  public async createNote(content: SaveContent): Promise<string | null> {
    const response = await this.request<{ note_id: string }>('/bitable/v1/apps/notes', 'POST', {
      title: content.title,
      body: {
        content: `${content.url}\n\n${content.content}`,
      },
    });
    return response.code === 0 && response.data ? response.data.note_id : null;
  }

  /**
   * 保存内容到飞书
   */
  public async saveContent(content: SaveContent, target: SaveTarget, targetId?: string): Promise<string | null> {
    let savedId: string | null = null;

    switch (target) {
      case 'doc':
        savedId = await this.createDocument(content);
        break;
      case 'wiki':
        if (targetId) {
          savedId = await this.createWikiDocument(targetId, content);
        }
        break;
      case 'note':
        savedId = await this.createNote(content);
        break;
    }

    if (savedId) {
      // 保存历史记录
      await this.saveHistory({
        id: savedId,
        title: content.title,
        url: content.url,
        target,
        targetId: targetId || savedId,
        saveTime: Date.now(),
      });
    }

    return savedId;
  }

  /**
   * 保存历史记录
   */
  private async saveHistory(history: SaveHistory): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const { saveHistory = [] } = await chrome.storage.local.get('saveHistory');
        saveHistory.unshift(history);

        // 限制历史记录数量为50条
        if (saveHistory.length > 50) {
          saveHistory.pop();
        }

        await chrome.storage.local.set({ saveHistory });
      }
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  }

  /**
   * 获取保存历史记录
   */
  public async getHistory(): Promise<SaveHistory[]> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const { saveHistory = [] } = await chrome.storage.local.get('saveHistory');
        return saveHistory;
      }
      return [];
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 清除保存历史记录
   */
  public async clearHistory(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ saveHistory: [] });
      }
    } catch (error) {
      console.error('清除历史记录失败:', error);
    }
  }

  /**
   * 退出登录
   */
  public async logout(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.userId = null;
    await this.saveTokens();
  }
}

// 导出单例实例
export const feishuApi = new FeishuApiService();
