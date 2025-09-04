import ConfigPrompt from './ConfigPrompt';
import { useStorage, validateConfiguration, MessageType } from '@extension/shared';
import { sendRequest } from '@extension/shared/lib/message/message';
import { feishuStorage } from '@extension/storage';
import {
  Button,
  Input,
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  MultiSelect,
} from '@extension/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { BitableField } from '@extension/shared';
import type React from 'react';

const formSchema = z.object({
  title: z.string().min(1, '请输入标题'),
  url: z.string().min(1, '请输入url'),
  tag: z.array(z.string()).min(1, '请选择标签'),
  icon: z.instanceof(File).optional(),
});

type FormData = z.infer<typeof formSchema>;

const SaveToFeishu: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [fields, setFields] = useState<BitableField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 获取保存偏好设置
  const { savePreferences } = useStorage(feishuStorage);

  const tagOptions = useMemo(() => {
    const options = fields.find(field => field.field_name === 'tag')?.property?.options;
    return options || [];
  }, [fields]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      url: '',
      tag: [],
    },
  });

  // 初始化
  useEffect(() => {
    init();
  }, [savePreferences]);

  // 处理配置保存后的回调
  const handleConfigSaved = async () => {
    try {
      setError('');
      await init();
    } catch (error) {
      console.error('配置保存后初始化失败:', error);
      setIsConfigured(false);
      setError('配置验证失败');
    }
  };

  // 将初始化逻辑提取为独立函数
  const init = async () => {
    try {
      // 使用统一的配置验证函数
      const configValidation = await validateConfiguration();

      if (!configValidation.isValid) {
        console.warn('配置验证失败:', configValidation.errorMessage);

        setIsConfigured(false);
        return;
      }

      setIsConfigured(true);
      setFields(configValidation.fields || []);

      // 获取当前页面信息
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab && tab.url && tab.title) {
        form.reset({
          url: tab.url,
          title: tab.title,
          tag: [],
        });
      }
    } catch (error) {
      console.error('初始化失败:', error);
      setError('初始化失败');
      setIsConfigured(false);
    }
  };

  // 处理表单提交
  const onSubmit = async (values: FormData) => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      console.log('保存数据:', values);

      // 构建要保存到飞书多维表格的字段数据
      const recordFields: Record<
        string,
        | string
        | string[]
        | {
            text?: string;
            link: string;
          }
      > = {
        标题: values.title,
        url: {
          link: values.url,
        },
        tag: values.tag,
      };

      // 如果有icon文件，先上传文件
      if (values.icon) {
        try {
          const uploadResponse = await sendRequest(MessageType.UPLOAD_MEDIA, {
            file_name: values.icon.name,
            parent_type: 'doc_file',
            parent_node: 'root',
            size: values.icon.size,
            file: values.icon,
          });

          if (uploadResponse.data?.file_token) {
            recordFields.icon = uploadResponse.data.file_token;
          }
        } catch (uploadError) {
          console.error('文件上传失败:', uploadError);
          // 文件上传失败时继续保存记录，但不包含icon
        }
      }

      // 调用飞书API创建记录
      const response = await sendRequest(MessageType.CREATE_BITABLE_RECORD, {
        fields: recordFields,
        user_id_type: 'open_id',
      });

      if (response.data?.record) {
        console.log('保存成功:', response.data.record);
        setSaveSuccess(true);

        // 3秒后关闭弹窗
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        setError('保存失败：未返回有效数据');
      }
    } catch (error) {
      console.error('保存失败:', error);
      setError('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染配置提示界面
  if (isConfigured === false) {
    return <ConfigPrompt onConfigSaved={handleConfigSaved} />;
  }

  // 渲染保存成功界面
  if (saveSuccess) {
    return (
      <Card className="min-h-[300px] min-w-[350px]">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="mb-4 rounded-full bg-green-100 p-3 text-green-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <CardTitle className="mb-2 text-xl">保存成功</CardTitle>
          <p className="text-muted-foreground mb-4">内容已成功保存到飞书</p>
        </CardContent>
      </Card>
    );
  }

  // 渲染主界面
  return (
    <div className="flex h-[500px] flex-col">
      {/* 头部 */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Save to Feishu</h1>
          <Button variant="ghost" size="sm" onClick={() => window.close()}>
            ✕
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* 表单区域 */}
      <div className="flex-1 p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    标题
                    <span className="ml-1 text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="请输入标题" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Url
                    <span className="ml-1 text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="请输入Url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    tag
                    <span className="ml-1 text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={tagOptions?.map(item => ({
                        label: item.name,
                        value: item.name,
                      }))}
                      onValueChange={field.onChange}
                      defaultValue={field.value || []}
                      placeholder={'请选择标签'}
                      searchable={true}
                      maxCount={3}
                      className="w-full"
                      modalPopover={true}
                      popoverClassName="max-h-[200px]"
                      responsive={{
                        mobile: {
                          maxCount: 2,
                          compactMode: true,
                        },
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>icon</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        onChange={e => {
                          const file = e.target.files?.[0] || null;
                          field.onChange(file);
                        }}
                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      />
                      {field.value && <div className="text-sm text-gray-600">已选择文件: {field.value.name}</div>}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 提交按钮 */}
            <div className="pt-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                {isSaving ? '保存中...' : '保存到飞书'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SaveToFeishu;
