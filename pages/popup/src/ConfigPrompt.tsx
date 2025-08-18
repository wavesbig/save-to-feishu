import { Button, Input } from '@extension/ui';
import { useState } from 'react';
import type React from 'react';

interface ConfigPromptProps {
  onConfigSaved: () => void;
}

const ConfigPrompt: React.FC<ConfigPromptProps> = ({ onConfigSaved }) => {
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveConfig = async () => {
    if (!appId.trim() || !appSecret.trim()) {
      setError('请填写完整的应用信息');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // 保存到本地存储
      await chrome.storage.local.set({
        feishuAppId: appId.trim(),
        feishuAppSecret: appSecret.trim(),
      });

      // 通知父组件配置已保存
      onConfigSaved();
    } catch (error) {
      console.error('保存配置失败:', error);
      setError('保存配置失败');
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* 错误提示 */}
      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
          {error}
        </div>
      )}

      {/* 配置表单 */}
      <div className="space-y-4">
        <div>
          <label htmlFor="appId" className="mb-1 block text-sm font-medium">
            应用 ID (App ID)
          </label>
          <Input
            id="appId"
            type="text"
            value={appId}
            onChange={e => setAppId(e.target.value)}
            placeholder="请输入飞书应用 ID"
          />
        </div>

        <div>
          <label htmlFor="appSecret" className="mb-1 block text-sm font-medium">
            应用密钥 (App Secret)
          </label>
          <Input
            id="appSecret"
            type="password"
            value={appSecret}
            onChange={e => setAppSecret(e.target.value)}
            placeholder="请输入飞书应用密钥"
          />
        </div>

        <div className="pt-2">
          <Button
            className="w-full"
            onClick={handleSaveConfig}
            disabled={isSaving || !appId.trim() || !appSecret.trim()}>
            {isSaving ? '正在保存...' : '保存配置'}
          </Button>
        </div>

        <div className="text-center">
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
      </div>
    </div>
  );
};

export default ConfigPrompt;
