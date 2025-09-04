import type { BitableField } from '../types/feishu.js';
// 必需字段配置
export interface RequiredFieldConfig {
  field_name: string;
  ui_type: string;
}

// 默认必需字段
export const REQUIRED_FIELDS: RequiredFieldConfig[] = [
  { field_name: '标题', ui_type: 'Text' },
  { field_name: 'url', ui_type: 'Url' },
  { field_name: 'tag', ui_type: 'MultiSelect' },
  { field_name: 'icon', ui_type: 'Attachment' },
];

// 飞书字段类型映射到UI类型
export const FEISHU_FIELD_TYPE_MAP: Record<number, string> = {
  1: 'Text', // 多行文本
  2: 'Number', // 数字
  3: 'SingleSelect', // 单选
  4: 'MultiSelect', // 多选
  5: 'DateTime', // 日期时间
  7: 'Checkbox', // 复选框
  11: 'Person', // 人员
  13: 'Phone', // 电话号码
  15: 'Url', // 超链接
  17: 'Attachment', // 附件
  18: 'SingleLink', // 单向关联
  19: 'Formula', // 公式
  20: 'DuplexLink', // 双向关联
  21: 'Location', // 地理位置
  22: 'GroupChat', // 群组
  23: 'CreatedTime', // 创建时间
  24: 'ModifiedTime', // 最后更新时间
  25: 'CreatedUser', // 创建人
  26: 'ModifiedUser', // 修改人
  1001: 'AutoNumber', // 自动编号
};

// 字段验证函数
export const validateRequiredFields = (
  fields: BitableField[],
): {
  isValid: boolean;
  missingFields: RequiredFieldConfig[];
  invalidFields: Array<{ field: BitableField; expected: string; actual: string }>;
} => {
  const missingFields: RequiredFieldConfig[] = [];
  const invalidFields: Array<{ field: BitableField; expected: string; actual: string }> = [];

  for (const requiredField of REQUIRED_FIELDS) {
    const field = fields.find(f => f.field_name === requiredField.field_name);

    if (!field) {
      missingFields.push(requiredField);
    } else {
      const actualUiType = FEISHU_FIELD_TYPE_MAP[field.type] || 'Unknown';
      if (actualUiType !== requiredField.ui_type) {
        invalidFields.push({
          field,
          expected: requiredField.ui_type,
          actual: actualUiType,
        });
      }
    }
  }

  return {
    isValid: missingFields.length === 0 && invalidFields.length === 0,
    missingFields,
    invalidFields,
  };
};
