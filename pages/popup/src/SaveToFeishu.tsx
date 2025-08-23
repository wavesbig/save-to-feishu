import ConfigPrompt from './ConfigPrompt';
import { useStorage, FEISHU_CONFIG, MessageType } from '@extension/shared';
import { feishuStorage } from '@extension/storage';
import {
  Button,
  Input,
  Textarea,
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardTitle,
  Badge,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@extension/ui';
import { useEffect, useState } from 'react';
import type { FeishuWiki, SaveContent, SaveTarget, MessageResponse } from '@extension/shared';
import type React from 'react';

const SaveToFeishu: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [pageInfo, setPageInfo] = useState<{ title: string; url: string; content: string }>({
    title: '',
    url: '',
    content: '',
  });
  const [wikis, setWikis] = useState<FeishuWiki[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<SaveTarget>('doc');
  const [selectedWikiId, setSelectedWikiId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 获取保存偏好设置
  const { savePreferences } = useStorage(feishuStorage);

  // 初始化
  useEffect(() => {
    init();
  }, [savePreferences]);

  // 处理配置保存完成
  const handleConfigSaved = () => {
    // 重新初始化，检查配置状态
    setIsConfigured(null);
    init();
  };

  // 将初始化逻辑提取为独立函数
  const init = async () => {
    try {
      // 检查飞书应用配置
      const appId = await FEISHU_CONFIG.getAppId();
      const appSecret = await FEISHU_CONFIG.getAppSecret();

      if (!appId || !appSecret) {
        setIsConfigured(false);
        return;
      }

      setIsConfigured(true);

      // 获取知识库列表
      try {
        const wikisResponse: MessageResponse = await chrome.runtime.sendMessage({
          action: MessageType.GET_WIKIS,
          timestamp: Date.now(),
        });
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
          content: '',
        });

        // 通过content script获取页面内容
        if (tab.id) {
          try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'get_page_content' });
            console.log('🚀 ~ init ~ response:', response);
            if (response && response.success && response.data) {
              setPageInfo({
                title: response.data.title || tab.title || '',
                url: response.data.url || tab.url || '',
                content: response.data.content || '',
              });
            }
          } catch (error) {
            console.error('获取页面内容失败:', error);
            // 如果content script获取失败，使用fallback方法
            try {
              const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  const getPageContent = () => {
                    const article = document.querySelector('article');
                    if (article) return article.innerText.substring(0, 1000);
                    const main = document.querySelector('main');
                    if (main) return main.innerText.substring(0, 1000);
                    return document.body.innerText.substring(0, 1000);
                  };
                  return getPageContent();
                },
              });
              if (result && result.result) {
                setPageInfo(prev => ({
                  ...prev,
                  content: result.result || '',
                }));
              }
            } catch (fallbackError) {
              console.error('Fallback获取页面内容失败:', fallbackError);
            }
          }
        }
      }

      // 设置默认目标
      if (savePreferences) {
        setSelectedTarget(savePreferences.defaultTarget);
        if (savePreferences.defaultWikiId) {
          setSelectedWikiId(savePreferences.defaultWikiId);
        }
      }
    } catch (error) {
      console.error('初始化失败:', error);
      setError('初始化失败');
    }
  };

  // 处理添加标签
  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  // 处理删除标签
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 处理保存内容
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const content: SaveContent = {
        title: pageInfo.title,
        url: pageInfo.url,
        content: pageInfo.content,
        target: selectedTarget,
        tags: savePreferences.includeTags ? tags : undefined,
      };

      // 如果目标是知识库，需要指定知识库ID
      if (selectedTarget === 'wiki') {
        content.targetId = selectedWikiId;
      }

      const response: MessageResponse = await chrome.runtime.sendMessage({
        action: MessageType.SAVE_TO_FEISHU,
        data: content,
        timestamp: Date.now(),
      });

      if (response.success) {
        setSaveSuccess(true);

        // 3秒后关闭弹窗
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        setError(response.error || '保存失败');
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
    <div className="p-4">
      {/* 头部 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <img src={chrome.runtime.getURL('icon-34.png')} alt="Save to Feishu" className="mr-2 h-6 w-6" />
          <h1 className="text-lg font-bold">保存到飞书111</h1>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 内容编辑 */}
      <div className="mb-4">
        <Label htmlFor="title" className="mb-1 block">
          标题
        </Label>
        <Input
          id="title"
          type="text"
          value={pageInfo.title}
          onChange={e => setPageInfo({ ...pageInfo, title: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="url" className="mb-1 block">
          URL
        </Label>
        <Input id="url" type="text" value={pageInfo.url} readOnly className="bg-muted" />
      </div>

      <div className="mb-4">
        <Label htmlFor="content" className="mb-1 block">
          内容预览
        </Label>
        <Textarea
          id="content"
          value={pageInfo.content}
          onChange={e => setPageInfo({ ...pageInfo, content: e.target.value })}
          className="h-24"
        />
      </div>

      {/* 保存选项 */}
      <div className="mb-4">
        <Label className="mb-2 block">保存到</Label>
        <div className="mb-2 flex space-x-2">
          <Button
            variant={selectedTarget === 'doc' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTarget('doc')}>
            文档
          </Button>
          <Button
            variant={selectedTarget === 'wiki' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTarget('wiki')}>
            知识库
          </Button>
          <Button
            variant={selectedTarget === 'note' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTarget('note')}>
            便签
          </Button>
        </div>

        {/* 知识库选择 */}
        {selectedTarget === 'wiki' && (
          <div className="mb-4">
            <Label htmlFor="wiki-select" className="mb-1 block">
              选择知识库
            </Label>
            <Select value={selectedWikiId} onValueChange={setSelectedWikiId}>
              <SelectTrigger>
                <SelectValue placeholder="请选择知识库" />
              </SelectTrigger>
              <SelectContent>
                {wikis.map(wiki => (
                  <SelectItem key={wiki.id} value={wiki.id}>
                    {wiki.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* 标签 */}
      {savePreferences.includeTags && (
        <div className="mb-4">
          <Label htmlFor="tag-input" className="mb-1 block">
            标签
          </Label>
          <div className="mb-2 flex">
            <Input
              id="tag-input"
              type="text"
              value={currentTag}
              onChange={e => setCurrentTag(e.target.value)}
              placeholder="添加标签"
              className="flex-1 rounded-r-none"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button variant="secondary" onClick={handleAddTag} className="rounded-l-none">
              添加
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center">
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-muted-foreground hover:text-foreground ml-1 h-auto p-0"
                  aria-label={`删除标签 ${tag}`}>
                  &times;
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 保存按钮 */}
      <div className="mt-6">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={isSaving || (selectedTarget === 'wiki' && !selectedWikiId)}>
          {isSaving ? '正在保存...' : '保存到飞书'}
        </Button>
      </div>
    </div>
  );
};

export default SaveToFeishu;
