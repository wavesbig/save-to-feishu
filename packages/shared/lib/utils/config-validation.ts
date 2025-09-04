import { validateRequiredFields } from './feishu.js';
import { FEISHU_CONFIG } from '../config/feishu-config.js';
import { sendRequest } from '../message/message.js';
import { MessageType } from '../types/message.js';
import type { FeishuAppInfo } from '../config/feishu-config.js';
import type { BitableField } from '../types/feishu.js';

// 配置验证结果类型
export interface ConfigValidationResult {
  isValid: boolean;
  /** 是否为字段校验错误 */
  code?: 'field_validation_failed';
  errorMessage?: string;
  missingFields?: Array<{ field_name: string; ui_type: string }>;
  invalidFields?: Array<{ field: BitableField; expected: string; actual: string }>;
}

// 基础配置检查
export const checkBasicConfig = async (): Promise<{
  isValid: boolean;
  appId?: string;
  appSecret?: string;
  appToken?: string;
  tableId?: string;
}> => {
  try {
    const { appId, appSecret, appToken, tableId } = await FEISHU_CONFIG.getAppInfo();

    const isValid = !!(appId && appSecret && appToken && tableId);

    return {
      isValid,
      appId,
      appSecret,
      appToken,
      tableId,
    };
  } catch (error) {
    console.error('检查基础配置失败:', error);
    return { isValid: false };
  }
};

// 字段验证
export const validateBitableFields = async (
  appToken: string,
  tableId: string,
): Promise<{
  isValid: boolean;
  fields?: BitableField[];
  validation?: ReturnType<typeof validateRequiredFields>;
  error?: string;
}> => {
  try {
    const res = await sendRequest(MessageType.GET_BITABLE_FIELDS, {
      appToken: appToken,
      tableId: tableId,
      page_size: 100,
    });

    if (res.code !== 0) {
      return {
        isValid: false,
        error: 'API调用失败',
      };
    }

    const fields = res.data?.items || [];
    const validation = validateRequiredFields(fields);

    return {
      isValid: validation.isValid,
      fields,
      validation,
    };
  } catch (error) {
    console.error('字段验证失败:', error);
    return {
      isValid: false,
      error: '字段验证过程中发生错误',
    };
  }
};

// 统一的配置验证函数
export const validateConfiguration = async (): Promise<ConfigValidationResult> => {
  try {
    // 1. 检查基础配置
    const basicConfig = await checkBasicConfig();
    if (!basicConfig.isValid) {
      return {
        isValid: false,
        errorMessage: '缺少必需的配置信息（应用ID、应用密钥、多维表格Token或表格ID）',
      };
    }

    // 2. 验证字段配置
    const fieldValidation = await validateBitableFields(basicConfig.appToken!, basicConfig.tableId!);

    if (!fieldValidation.isValid) {
      if (fieldValidation.error === 'API调用失败') {
        return {
          isValid: false,
          errorMessage: '无法获取多维表格字段信息，请检查Token和表格ID是否正确',
        };
      }

      // 字段验证失败
      const validation = fieldValidation.validation!;
      let errorMessage = '多维表格字段验证失败：\n\n';

      if (validation.missingFields.length > 0) {
        errorMessage += '缺少必需字段：\n';
        validation.missingFields.forEach(field => {
          errorMessage += `• ${field.field_name} (类型: ${field.ui_type})\n`;
        });
        errorMessage += '\n';
      }

      if (validation.invalidFields.length > 0) {
        errorMessage += '字段类型不匹配：\n';
        validation.invalidFields.forEach(({ field, expected, actual }) => {
          errorMessage += `• ${field.field_name}: 期望 ${expected}，实际 ${actual}\n`;
        });
        errorMessage += '\n';
      }

      errorMessage += '请确保多维表格包含以下字段：\n';
      errorMessage += '• 标题 (文本类型)\n';
      errorMessage += '• url (超链接类型)\n';
      errorMessage += '• tag (多选类型)\n';
      errorMessage += '• icon (附件类型)\n\n';
      errorMessage += '您可以使用模板快速设置正确的字段结构。';

      return {
        isValid: false,
        code: 'field_validation_failed',
        errorMessage,
        missingFields: validation.missingFields,
        invalidFields: validation.invalidFields,
      };
    }

    return {
      isValid: true,
    };
  } catch (error) {
    console.error('配置验证失败:', error);
    return {
      isValid: false,
      errorMessage: '配置验证过程中发生未知错误',
    };
  }
};

// 保存配置并验证
export const saveAndValidateConfig = async (config: FeishuAppInfo): Promise<ConfigValidationResult> => {
  try {
    // 保存到本地存储
    await FEISHU_CONFIG.setAppInfo(config);

    // 验证配置
    const validation = await validateConfiguration();

    return validation;
  } catch (error) {
    console.error('保存和验证配置失败:', error);
    FEISHU_CONFIG.clearAppInfo();
    return {
      isValid: false,
      errorMessage: '保存配置失败，请检查网络连接和配置信息',
    };
  }
};
