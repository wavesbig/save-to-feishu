import { MessageType, sendRequest, validateRequiredFields } from '@extension/shared';
import {
  Button,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@extension/ui';
import { toast } from '@extension/ui/lib/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type React from 'react';

interface ConfigPromptProps {
  onConfigSaved: () => void;
}

const formSchema = z.object({
  appId: z.string().min(1, '请输入应用ID'),
  appSecret: z.string().min(1, '请输入应用密钥'),
  appToken: z.string().min(1, '请输入多维表格Token'),
  tableId: z.string().min(1, '请输入多维表格ID'),
});

const ConfigPrompt: React.FC<ConfigPromptProps> = ({ onConfigSaved }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationError, setValidationError] = useState<string>('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appId: '',
      appSecret: '',
      appToken: '',
      tableId: '',
    },
  });

  // 组件加载时从存储中读取数据
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const result = await chrome.storage.local.get([
          'feishuAppId',
          'feishuAppSecret',
          'app_token',
          'table_id',
          'tempAppId',
          'tempAppSecret',
          'tempAppToken',
          'tempTableId',
        ]);

        // 优先使用已保存的配置，如果没有则使用临时保存的输入
        if (result.feishuAppId && result.feishuAppSecret) {
          form.reset({
            appId: result.feishuAppId,
            appSecret: result.feishuAppSecret,
            appToken: result.app_token || '',
            tableId: result.table_id || '',
          });
        } else if (result.tempAppId || result.tempAppSecret || result.tempAppToken || result.tempTableId) {
          form.reset({
            appId: result.tempAppId || '',
            appSecret: result.tempAppSecret || '',
            appToken: result.tempAppToken || '',
            tableId: result.tempTableId || '',
          });
        }
      } catch (error) {
        console.error('加载存储数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, [form]);

  // 实时保存用户输入到临时存储
  const handleFieldChange = async (field: string, value: string) => {
    try {
      const tempKey = `temp${field.charAt(0).toUpperCase() + field.slice(1)}`;
      await chrome.storage.local.set({ [tempKey]: value });
    } catch (error) {
      console.error('保存临时数据失败:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);

    try {
      // 保存到本地存储
      await chrome.storage.local.set({
        feishuAppId: values.appId.trim(),
        feishuAppSecret: values.appSecret.trim(),
        app_token: values.appToken.trim(),
        table_id: values.tableId.trim(),
      });

      // 获取字段信息
      const res = await sendRequest(MessageType.GET_BITABLE_FIELDS, {
        app_token: values.appToken.trim(),
        table_id: values.tableId.trim(),
        page_size: 100,
      });

      if (res.code === 0) {
        // 验证必需字段
        const fields = res.data?.items || [];
        const validation = validateRequiredFields(fields);

        if (validation.isValid) {
          console.log('字段验证通过');
          // 通知父组件配置已保存
          onConfigSaved();
          // 清除临时存储
          await chrome.storage.local.remove(['tempAppId', 'tempAppSecret', 'tempAppToken', 'tempTableId']);
        } else {
          // 字段验证失败，显示详细错误信息
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

          setValidationError(errorMessage);
          // 移除无效配置
          await chrome.storage.local.remove(['feishuAppId', 'feishuAppSecret', 'app_token', 'table_id']);
        }
      } else {
        // 保存到本地存储
        await chrome.storage.local.remove(['feishuAppId', 'feishuAppSecret', 'app_token', 'table_id']);
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      toast.error('保存配置失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-muted-foreground text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-4 rounded-full bg-blue-100 p-3">
          <img src={chrome.runtime.getURL('icon-128.png')} alt="Save to Feishu" className="h-12 w-12" />
        </div>
        <h1 className="text-xl font-bold">配置飞书应用</h1>
        <p className="text-muted-foreground mt-2 text-center text-sm">请输入您的飞书应用信息</p>
      </div>

      {/* 配置表单 */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="appId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>应用 ID (App ID)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请输入飞书应用 ID"
                    {...field}
                    onChange={e => {
                      field.onChange(e);
                      handleFieldChange('appId', e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appSecret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>应用密钥 (App Secret)</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="请输入飞书应用密钥"
                    {...field}
                    onChange={e => {
                      field.onChange(e);
                      handleFieldChange('appSecret', e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel>多维表格 Token (App Token)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请输入多维表格 Token"
                    {...field}
                    onChange={e => {
                      field.onChange(e);
                      handleFieldChange('appToken', e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tableId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>多维表格 ID (Table ID)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请输入多维表格 ID"
                    {...field}
                    onChange={e => {
                      field.onChange(e);
                      handleFieldChange('tableId', e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? '正在保存...' : '保存配置'}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-4 text-center">
        <p className="text-muted-foreground text-xs">
          如需获取应用信息，请访问{' '}
          <a
            href="https://open.feishu.cn/app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline">
            飞书开放平台
          </a>
        </p>
      </div>

      {/* 字段验证错误弹窗 */}
      <AlertDialog open={!!validationError} onOpenChange={() => setValidationError('')}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">字段验证失败</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line text-left">{validationError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <AlertDialogAction
              onClick={() => {
                window.open(
                  'https://r57ssyz8cr.feishu.cn/base/KAoIbSoDfaUPd4s8GjdcsnZenBd?from=from_copylink',
                  '_blank',
                );
              }}
              className="bg-blue-600 hover:bg-blue-700">
              使用模板
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setValidationError('')}>我知道了</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConfigPrompt;
