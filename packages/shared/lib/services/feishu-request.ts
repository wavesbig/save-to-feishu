/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 飞书API请求封装
 * 基于axios封装飞书开放平台API请求
 */
import { FEISHU_CONFIG } from '../config/feishu-config.js';
import { notifyUI } from '../message/message.js';
import { MessageType } from '../types/message.js';
import axios from 'axios';
import type { ShowToastMessagePayload } from '../types/message.js';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 令牌管理
interface TokenManager {
  tenantAccessToken: string | null;
  tokenExpireTime: number;
}

class FeishuRequest {
  private axios: AxiosInstance;
  private tokenManager: TokenManager = {
    tenantAccessToken: null,
    tokenExpireTime: 0,
  };

  constructor() {
    // 创建axios实例
    this.axios = axios.create({
      baseURL: 'https://open.feishu.cn/open-apis',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    // 请求拦截器
    this.axios.interceptors.request.use(
      async config => {
        // 确保有有效的访问令牌
        await this.ensureAccessToken();

        // 添加授权头
        if (this.tokenManager.tenantAccessToken) {
          config.headers.Authorization = `Bearer ${this.tokenManager.tenantAccessToken}`;
        }

        return config;
      },
      error => Promise.reject(error),
    );

    // 响应拦截器
    this.axios.interceptors.response.use(
      (response: AxiosResponse<FeishuApiResponse>) => {
        const { data } = response;

        // 检查飞书API响应状态
        if (data.code !== 0) {
          console.error('飞书API错误:', data.msg, data.code);

          // 针对权限不足错误(99991672)进行特殊处理
          if (data.code === 99991672) {
            this.handlePermissionError(data);
          } else {
            // 发送普通错误消息到UI层
            this.sendToastMessage(data.msg || '飞书API请求失败');
          }

          return Promise.reject(new Error(data.msg || '飞书API请求失败'));
        }

        // 直接返回飞书API的数据内容
        return data as any;
      },
      async error => {
        // 处理令牌过期
        if (error.response?.data?.code === 99991663) {
          console.log('令牌过期，尝试刷新...');
          await this.refreshAccessToken();

          // 重试原请求
          const originalRequest = error.config;
          if (originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${this.tokenManager.tenantAccessToken}`;
            return this.axios.request(originalRequest);
          }
        }

        // 检查是否为权限不足错误(99991672)
        if (error.response?.data?.code === 99991672) {
          console.error('飞书API权限错误:', error.response.data);
          this.handlePermissionError(error.response.data);
        } else {
          // 发送网络错误消息到UI层
          const errorMessage = error.response?.data?.msg || error.message || '网络请求失败';
          this.sendToastMessage(errorMessage);
        }

        return Promise.reject(error);
      },
    );

    // 初始化时加载存储的令牌
    this.loadStoredTokens();
  }

  /**
   * 从存储中加载令牌
   */
  private async loadStoredTokens(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(['tenantAccessToken', 'tokenExpireTime']);

        this.tokenManager.tenantAccessToken = result.tenantAccessToken || null;
        this.tokenManager.tokenExpireTime = result.tokenExpireTime || 0;
      }
    } catch (error) {
      console.warn('加载存储的令牌失败:', error);
    }
  }

  /**
   * 保存令牌到存储
   */
  private async saveTokens(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({
          tenantAccessToken: this.tokenManager.tenantAccessToken,
          tokenExpireTime: this.tokenManager.tokenExpireTime,
        });
      }
    } catch (error) {
      console.warn('保存令牌失败:', error);
    }
  }

  /**
   * 获取tenant_access_token
   */
  private async getAccessTokens(): Promise<FeishuApiResponse> {
    const appId = await FEISHU_CONFIG.getAppId();
    const appSecret = await FEISHU_CONFIG.getAppSecret();

    if (!appId || !appSecret) {
      throw new Error('飞书应用配置不完整，请在设置页面配置APP_ID和APP_SECRET');
    }

    try {
      const response = await axios.post<FeishuApiResponse>(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        {
          app_id: appId,
          app_secret: appSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        },
      );

      const { data } = response;

      if (data.code === 0) {
        // 保存令牌
        this.tokenManager.tenantAccessToken = data.tenant_access_token || null;
        this.tokenManager.tokenExpireTime = Date.now() + (data.expire || 7200) * 1000;

        // 保存到存储
        await this.saveTokens();

        return data;
      } else {
        throw new Error(data.msg || '获取访问令牌失败');
      }
    } catch (error) {
      console.error('获取访问令牌失败:', error);
      throw error;
    }
  }

  /**
   * 确保有有效的访问令牌
   */
  private async ensureAccessToken(): Promise<void> {
    const now = Date.now();

    // 检查令牌是否存在且未过期（提前30分钟刷新）
    if (this.tokenManager.tenantAccessToken && this.tokenManager.tokenExpireTime > now + 30 * 60 * 1000) {
      return;
    }

    // 获取新的访问令牌
    await this.getAccessTokens();
  }

  /**
   * 刷新访问令牌
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      await this.getAccessTokens();
    } catch (error) {
      console.error('刷新访问令牌失败:', error);
      throw error;
    }
  }

  /**
   * 发送GET请求
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<FeishuApiResponse<T>> {
    return this.axios.get(url, config);
  }

  /**
   * 发送POST请求
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<FeishuApiResponse<T>> {
    return this.axios.post(url, data, config);
  }

  /**
   * 发送PUT请求
   */
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<FeishuApiResponse<T>> {
    return this.axios.put(url, data, config);
  }

  /**
   * 发送PATCH请求
   */
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<FeishuApiResponse<T>> {
    return this.axios.patch(url, data, config);
  }

  /**
   * 发送DELETE请求
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<FeishuApiResponse<T>> {
    return this.axios.delete(url, config);
  }

  /**
   * 获取当前的tenant_access_token
   */
  public getTenantAccessToken(): string | null {
    return this.tokenManager.tenantAccessToken;
  }

  /**
   * 获取多维表格Token
   */
  public async getAppToken(): Promise<string> {
    return await FEISHU_CONFIG.getAppToken();
  }

  /**
   * 获取多维表格ID
   */
  public async getTableId(): Promise<string> {
    return await FEISHU_CONFIG.getTableId();
  }

  /**
   * 清除所有令牌
   */
  public async clearTokens(): Promise<void> {
    this.tokenManager.tenantAccessToken = null;
    this.tokenManager.tokenExpireTime = 0;

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(['tenantAccessToken', 'tokenExpireTime']);
      }
    } catch (error) {
      console.warn('清除存储的令牌失败:', error);
    }
  }

  /**
   * 手动刷新令牌
   */
  public async refreshTokens(): Promise<FeishuApiResponse> {
    return this.getAccessTokens();
  }

  /**
   * 处理权限不足错误(99991672)
   */
  private handlePermissionError(data: FeishuApiResponse): void {
    try {
      const permissionInfo = this.extractPermissionInfo(data);
      const errorMessage = this.buildPermissionErrorMessage(permissionInfo.requiredScopes);
      const helpUrl = this.getPermissionHelpUrl(data);

      this.sendToastMessage('应用权限不足', {
        description: errorMessage,
        ...(helpUrl && {
          actionText: '去申请',
          actionUrl: helpUrl,
        }),
      });
    } catch (error) {
      console.error('处理权限错误时出现异常:', error);
      this.sendToastMessage(data.msg || '应用权限不足，请联系管理员申请相应权限');
    }
  }

  /**
   * 提取权限信息
   */
  private extractPermissionInfo(data: FeishuApiResponse): { requiredScopes: string } {
    const permissionViolations = data.error?.permission_violations || [];
    const requiredScopes = permissionViolations
      .filter(violation => violation.type === 'action_scope_required')
      .map(violation => violation.subject)
      .filter(Boolean)
      .join(', ');

    return { requiredScopes };
  }

  /**
   * 构建权限错误消息
   */
  private buildPermissionErrorMessage(requiredScopes: string): string {
    let message = '';

    if (requiredScopes) {
      message += `所需权限：${requiredScopes}，`;
    }

    message += '请联系管理员为应用申请相应权限。';
    return message;
  }

  /**
   * 获取权限申请链接
   */
  private getPermissionHelpUrl(data: FeishuApiResponse): string | undefined {
    // 优先使用error.helps中的链接
    const helpUrl = data.error?.helps?.[0]?.url;
    if (helpUrl) return helpUrl;

    // 其次从msg字段中解析权限申请链接
    const msgLinkMatch = data.msg?.match(/https:\/\/[^\s]+/);
    return msgLinkMatch?.[0];
  }

  /**
   * 发送消息到UI层
   */
  private sendToastMessage(message: string, data?: ShowToastMessagePayload['data']): void {
    try {
      const toastMessage: ShowToastMessagePayload = {
        type: 'error',
        message,
        data,
      };

      notifyUI(MessageType.SHOW_TOAST, toastMessage);
    } catch (error) {
      console.warn('发送Toast消息失败:', error);
    }
  }
}

// 创建单例实例
const feishuRequest = new FeishuRequest();

// 导出实例和类型
export { feishuRequest, FeishuRequest };
export default feishuRequest;

/**
 * 飞书API响应类型定义
 * 基于飞书开放平台官方文档规范
 */
export interface FeishuApiResponse<T = any> {
  /** 错误码，0表示成功，非0表示失败 */
  code: number;
  /** 错误信息描述 */
  msg: string;
  /** API调用结果数据，在操作类API中可能不存在 */
  data?: T;
  /** 请求是否成功，部分API响应中包含此字段 */
  success?: boolean;
  /** 租户访问令牌，在获取访问令牌接口中返回 */
  tenant_access_token?: string;
  /** 令牌过期时间（秒），在获取访问令牌接口中返回 */
  expire?: number;
  /** 详细错误信息，包含错误排查和权限相关信息 */
  error?: {
    /** 错误详细描述信息 */
    message?: string;
    /** 字段验证错误列表 */
    field_violations?: Array<{
      /** 错误字段名 */
      field: string;
      /** 错误字段值 */
      value: string;
      /** 错误描述 */
      description: string;
    }>;
    /** 权限违规信息列表 */
    permission_violations?: Array<{
      /** 所需权限范围 */
      scope?: string;
      /** 权限申请链接 */
      url?: string;
      /** 权限违规类型 */
      type?: string;
      /** 权限主体 */
      subject?: string;
    }>;
    /** 帮助信息列表 */
    helps?: Array<{
      /** 帮助链接地址 */
      url: string;
      /** 帮助信息描述 */
      description: string;
    }>;
    /** 日志ID，用于问题排查 */
    logid?: string;
    /** 故障排查建议链接 */
    troubleshooter?: string;
  };
}
