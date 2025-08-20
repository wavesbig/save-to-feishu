/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 飞书API请求封装
 * 基于axios封装飞书开放平台API请求
 */
import { FEISHU_CONFIG } from '../config/feishu-config.js';
import axios from 'axios';
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
}

// 创建单例实例
const feishuRequest = new FeishuRequest();

// 导出实例和类型
export { feishuRequest, FeishuRequest };
export default feishuRequest;

// 飞书API响应类型
export interface FeishuApiResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
  success: boolean;
  tenant_access_token?: string;
  expire?: number;
}
