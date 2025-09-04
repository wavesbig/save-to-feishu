/**
 * 飞书API服务类
 * 封装与飞书开放平台的交互
 */
import { feishuRequest } from './feishu-request.js';
import type {
  GetBitableRecordsParams,
  BitableData,
  GetBitableFieldsParams,
  BitableFieldsData,
} from '../types/feishu.js';

/**
 * 查询多维表格记录
 * @param params 查询参数
 * @returns 查询结果
 */
export const getBitableRecords = async (
  params: Omit<GetBitableRecordsParams, 'app_token' | 'table_id'> & {
    app_token?: string;
    table_id?: string;
  },
) => {
  // 从配置中获取app_token和table_id（如果未提供）
  const appToken = params.app_token || (await feishuRequest.getAppToken());
  const tableId = params.table_id || (await feishuRequest.getTableId());

  if (!appToken) {
    throw new Error('多维表格 App Token 未配置，请在设置中配置');
  }

  if (!tableId) {
    throw new Error('多维表格 Table ID 未配置，请在设置中配置');
  }

  const requestBody = {
    view_id: params.view_id,
    field_names: params.field_names,
    sort: params.sort,
    filter: params.filter,
  };

  const queryParams = new URLSearchParams();
  if (params.user_id_type) {
    queryParams.append('user_id_type', params.user_id_type);
  }
  if (params.page_token) {
    queryParams.append('page_token', params.page_token);
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size.toString());
  }

  const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  return await feishuRequest.post<BitableData>(url, requestBody);
};

/**
 * 获取多维表格字段
 * @param params 查询参数
 * @returns 字段列表
 */
export const getBitableFields = async (
  params: Omit<GetBitableFieldsParams, 'app_token' | 'table_id'> & {
    app_token?: string;
    table_id?: string;
  },
) => {
  // 从配置中获取app_token和table_id（如果未提供）
  const appToken = params.app_token || (await feishuRequest.getAppToken());
  const tableId = params.table_id || (await feishuRequest.getTableId());

  if (!appToken) {
    throw new Error('多维表格 App Token 未配置，请在设置中配置');
  }

  if (!tableId) {
    throw new Error('多维表格 Table ID 未配置，请在设置中配置');
  }

  const queryParams = new URLSearchParams();
  if (params.view_id) {
    queryParams.append('view_id', params.view_id);
  }
  if (params.text_field_as_array !== undefined) {
    queryParams.append('text_field_as_array', params.text_field_as_array.toString());
  }
  if (params.page_token) {
    queryParams.append('page_token', params.page_token);
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size.toString());
  }

  const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/fields${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  return await feishuRequest.get<BitableFieldsData>(url);
};

/**
 * 清除应用令牌
 */
export const logout = async () => await feishuRequest.clearTokens();
