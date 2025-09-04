import ConfigPrompt from './ConfigPrompt';
import { useStorage, MessageType, validateConfiguration } from '@extension/shared';
import { sendRequest } from '@extension/shared/lib/message/message';
import { feishuStorage } from '@extension/storage';
import { Button, Input, Alert, AlertDescription, Card, CardContent, CardTitle } from '@extension/ui';
import { useEffect, useState } from 'react';
import type React from 'react';

const SaveToFeishu: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [pageInfo, setPageInfo] = useState<{ title: string; url: string }>({
    title: '',
    url: '',
  });

  const [selectedWikiId, setSelectedWikiId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [, setShowAddForm] = useState(false);
  const [wikis, setWikis] = useState([]);

  // 获取保存偏好设置
  const { savePreferences } = useStorage(feishuStorage);

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

      // 获取知识库列表
      try {
        const wikisResponse = await sendRequest(MessageType.GET_WIKIS);
        console.log('🚀 ~ init ~ wikisResponse:', wikisResponse);

        if (wikisResponse.success && wikisResponse.data && wikisResponse.data.items) {
          setWikis(wikisResponse.data.items);
        }
      } catch (error) {
        console.error('获取知识库列表失败:', error);
      }

      // 获取当前页面信息
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.title) {
        setPageInfo({
          title: tab.title || '',
          url: tab.url || '',
        });
      }
    } catch (error) {
      console.error('初始化失败:', error);
      setError('初始化失败');
      setIsConfigured(false);
    }
  };

  // 处理选择知识库
  const handleSelectWiki = (wikiId: string) => {
    setSelectedWikiId(wikiId);
  };

  // 处理保存到知识库
  const handleSaveToWiki = async () => {
    if (!selectedWikiId) {
      setError('请选择知识库');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      // if (response.success) {
      //   setSaveSuccess(true);
      //   // 3秒后关闭弹窗
      //   setTimeout(() => {
      //     window.close();
      //   }, 3000);
      // } else {
      //   setError(response.error || '保存失败');
      // }
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
          <h1 className="text-lg font-semibold">Save to Notion</h1>
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

      {/* 表单选择区域 */}
      <div className="flex-1 p-4">
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="rounded bg-blue-50 px-2 py-1 text-sm font-medium text-blue-600">Select Form</h2>
            <Button variant="ghost" size="sm">
              ⚙️
            </Button>
          </div>

          {/* 知识库列表 */}
          <div className="space-y-2">
            {wikis.map(wiki => (
              <button
                key={wiki.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-gray-50 ${
                  selectedWikiId === wiki.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => handleSelectWiki(wiki.id)}>
                <div className="flex items-center">
                  <div className="mr-3 text-gray-400">📚</div>
                  <span className="font-medium">{wiki.name}</span>
                </div>
                <div className="text-gray-400">›</div>
              </button>
            ))}

            {/* 添加新表单按钮 */}
            <button
              className="flex cursor-pointer items-center rounded-lg border border-dashed border-gray-300 p-3 hover:bg-gray-50"
              onClick={() => setShowAddForm(true)}>
              <div className="mr-3 text-gray-400">+</div>
              <span className="text-gray-600">Add New Form</span>
              <div className="ml-auto text-gray-400">📋</div>
            </button>
          </div>
        </div>

        {/* 页面信息显示 */}
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <div className="mb-1 text-sm text-gray-600">标题</div>
          <Input
            value={pageInfo.title}
            onChange={e => setPageInfo({ ...pageInfo, title: e.target.value })}
            className="mb-2"
          />
          <div className="mb-1 text-sm text-gray-600">URL</div>
          <Input value={pageInfo.url} readOnly className="bg-white" />
        </div>
      </div>

      {/* 底部保存按钮 */}
      <div className="border-t p-4">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleSaveToWiki}
          disabled={isSaving || !selectedWikiId}>
          {isSaving ? '保存中...' : '保存到飞书'}
        </Button>
      </div>
    </div>
  );
};

export default SaveToFeishu;
