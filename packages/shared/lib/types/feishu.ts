/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 飞书相关类型定义
 */

// 多维表格查询记录请求参数类型
export interface GetBitableRecordsParams {
  appToken: string;
  tableId: string;
  view_id?: string;
  field_names?: string[];
  sort?: Array<{
    field_name: string;
    desc?: boolean;
  }>;
  filter?: {
    conjunction: 'and' | 'or';
    conditions: Array<{
      field_name: string;
      operator:
        | 'is'
        | 'isNot'
        | 'contains'
        | 'doesNotContain'
        | 'isEmpty'
        | 'isNotEmpty'
        | 'isGreater'
        | 'isGreaterEqual'
        | 'isLess'
        | 'isLessEqual';
      value?: string | number | boolean | string[];
    }>;
  };
  page_token?: string;
  page_size?: number;
  user_id_type?: 'open_id' | 'union_id' | 'user_id';
}

// 多维表格记录类型
export interface BitableRecord {
  record_id: string;
  fields: Record<string, any>;
  created_by?: {
    id: string;
    name?: string;
    email?: string;
  };
  created_time?: number;
  last_modified_by?: {
    id: string;
    name?: string;
    email?: string;
  };
  last_modified_time?: number;
}

// 多维表格查询记录响应类型
export interface BitableData {
  has_more: boolean;
  page_token?: string;
  total?: number;
  items: BitableRecord[];
}

// 获取字段请求参数类型
export interface GetBitableFieldsParams {
  appToken: string;
  tableId: string;
  view_id?: string;
  text_field_as_array?: boolean;
  page_token?: string;
  page_size?: number;
}

// 字段类型
export interface BitableField {
  field_id: string;
  field_name: string;
  type: number;
  property?: Record<string, any>;
  description?: string | Array<{ text: string; type: string }>;
  is_primary?: boolean;
}

// 获取字段响应类型
export interface BitableFieldsData {
  has_more: boolean;
  page_token?: string;
  total?: number;
  items: BitableField[];
}
