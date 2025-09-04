/**
 * 飞书API服务类
 * 封装与飞书开放平台的交互
 */
import { feishuRequest } from './feishu-request.js';
import { FEISHU_CONFIG } from '../config/feishu-config.js';
import type {
  GetBitableRecordsParams,
  BitableData,
  GetBitableFieldsParams,
  BitableFieldsData,
  CreateBitableRecordParams,
  CreateBitableRecordData,
  UploadMediaParams,
  UploadMediaData,
} from '../types/feishu.js';

/**
 * 查询多维表格记录
 * @param params 查询参数
 * @returns 查询结果
 */
export const getBitableRecords = async (
  params: Omit<GetBitableRecordsParams, 'appToken' | 'tableId'> & {
    appToken?: string;
    tableId?: string;
  },
) => {
  const { appToken, tableId } = await FEISHU_CONFIG.getAppInfo();

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
  params: Omit<GetBitableFieldsParams, 'appToken' | 'tableId'> & {
    appToken?: string;
    tableId?: string;
  },
) => {
  const { appToken, tableId } = await FEISHU_CONFIG.getAppInfo();

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
 * 新增多维表格记录
 * @param params 新增记录参数
 * @returns 新增记录结果
 */
export const createBitableRecord = async (
  params: Omit<CreateBitableRecordParams, 'appToken' | 'tableId'> & {
    appToken?: string;
    tableId?: string;
  },
) => {
  const { appToken, tableId } = await FEISHU_CONFIG.getAppInfo();

  if (!appToken) {
    throw new Error('多维表格 App Token 未配置，请在设置中配置');
  }

  if (!tableId) {
    throw new Error('多维表格 Table ID 未配置，请在设置中配置');
  }

  const requestBody = {
    fields: params.fields,
  };

  const queryParams = new URLSearchParams();
  if (params.user_id_type) {
    queryParams.append('user_id_type', params.user_id_type);
  }
  if (params.client_token) {
    queryParams.append('client_token', params.client_token);
  }
  if (params.ignore_consistency_check !== undefined) {
    queryParams.append('ignore_consistency_check', params.ignore_consistency_check.toString());
  }

  const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  return await feishuRequest.post<CreateBitableRecordData>(url, requestBody);
};

/**
 * 上传素材到云文档
 * @param params 上传参数
 * @returns 上传结果
 */
export const uploadMedia = async (params: UploadMediaParams) => {
  const formData = new FormData();

  formData.append('file_name', params.file_name);
  formData.append('parent_type', params.parent_type);
  formData.append('parent_node', params.parent_node);
  formData.append('size', params.size.toString());

  if (params.checksum) {
    formData.append('checksum', params.checksum);
  }

  if (params.extra) {
    formData.append('extra', params.extra);
  }

  formData.append('file', params.file);

  const url = '/drive/v1/medias/upload_all';

  // FormData会自动设置正确的Content-Type，包括boundary
  return await feishuRequest.post<UploadMediaData>(url, formData);
};

/**
 * 清除应用令牌
 */
export const logout = async () => await feishuRequest.clearTokens();
