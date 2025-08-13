import { useStorage } from '@extension/shared';
import { feishuStorage } from '@extension/storage';
import { Button, Input, Textarea } from '@extension/ui';
import { useEffect, useState } from 'react';
import type { FeishuUser, FeishuWiki, SaveContent, SaveTarget } from '@extension/shared';
import type React from 'react';

const SaveToFeishu: React.FC = () => {
  // 状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<FeishuUser | null>(null);
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
    const init = async () => {
      setIsLoading(true);
      try {
        // 获取当前用户信息
        const userResponse = await chrome.runtime.sendMessage({ action: 'feishu_get_user' });
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data.user);

          // 获取知识库列表
          const wikisResponse = await chrome.runtime.sendMessage({ action: 'feishu_get_wikis' });
          if (wikisResponse.success && wikisResponse.data) {
            setWikis(wikisResponse.data.items || []);
          }

          // 获取当前页面信息
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url && tab.title) {
            setPageInfo({
              title: tab.title || '',
              url: tab.url || '',
              content: '',
            });

            // 获取页面内容
            if (tab.id) {
              try {
                const [result] = await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: () => {
                    // 获取页面正文内容
                    const getPageContent = () => {
                      // 尝试获取文章内容
                      const article = document.querySelector('article');
                      if (article) return article.innerText.substring(0, 1000);

                      // 尝试获取主要内容
                      const main = document.querySelector('main');
                      if (main) return main.innerText.substring(0, 1000);

                      // 获取页面所有文本
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
              } catch (error) {
                console.error('获取页面内容失败:', error);
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
        } else {
          setError('未登录飞书账号');
        }
      } catch (error) {
        console.error('初始化失败:', error);
        setError('初始化失败');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [savePreferences]);

  // 处理授权
  const handleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({ action: 'feishu_auth' });
      if (response.success) {
        // 重新加载页面
        window.location.reload();
      } else {
        setError(response.error || '授权失败');
      }
    } catch (error) {
      console.error('授权失败:', error);
      setError('授权失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理退出登录
  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await chrome.runtime.sendMessage({ action: 'feishu_logout' });
      setUser(null);
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      setIsLoading(false);
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

      const response = await chrome.runtime.sendMessage({
        action: 'feishu_save_content',
        data: content,
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

  // 渲染登录界面
  if (!user) {
    return (
      <div className="flex min-h-[300px] min-w-[350px] flex-col items-center justify-center p-6">
        <div className="mb-4 rounded-full bg-blue-100 p-3">
          <img src={chrome.runtime.getURL('icon-128.png')} alt="Save to Feishu" className="h-12 w-12" />
        </div>
        <h1 className="mb-6 text-xl font-bold">保存到飞书</h1>

        {error && (
          <div className="border-destructive/50 bg-destructive/10 text-destructive mb-4 w-full rounded-md border p-3 text-center">
            {error}
          </div>
        )}

        <Button className="w-full" onClick={handleAuth} disabled={isLoading}>
          {isLoading ? '正在授权...' : '登录飞书账号'}
        </Button>
      </div>
    );
  }

  // 渲染保存成功界面
  if (saveSuccess) {
    return (
      <div className="flex min-h-[300px] min-w-[350px] flex-col items-center justify-center p-6">
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
        <h2 className="mb-2 text-xl font-bold">保存成功</h2>
        <p className="text-muted-foreground mb-4">内容已成功保存到飞书</p>
      </div>
    );
  }

  // 渲染主界面
  return (
    <div className="min-w-[400px] p-4">
      {/* 头部 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <img src={chrome.runtime.getURL('icon-34.png')} alt="Save to Feishu" className="mr-2 h-6 w-6" />
          <h1 className="text-lg font-bold">保存到飞书</h1>
        </div>

        <div className="flex items-center">
          <img src={user.avatar_url} alt={user.name} className="mr-2 h-6 w-6 rounded-full" />
          <span className="mr-2 text-sm">{user.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
            退出
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive mb-4 rounded-md border p-3">
          {error}
        </div>
      )}

      {/* 内容编辑 */}
      <div className="mb-4">
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
          标题
        </label>
        <Input
          id="title"
          type="text"
          value={pageInfo.title}
          onChange={e => setPageInfo({ ...pageInfo, title: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="url" className="mb-1 block text-sm font-medium text-gray-700">
          URL
        </label>
        <Input id="url" type="text" value={pageInfo.url} readOnly className="bg-muted" />
      </div>

      <div className="mb-4">
        <label htmlFor="content" className="mb-1 block text-sm font-medium text-gray-700">
          内容预览
        </label>
        <Textarea
          id="content"
          value={pageInfo.content}
          onChange={e => setPageInfo({ ...pageInfo, content: e.target.value })}
          className="h-24"
        />
      </div>

      {/* 保存选项 */}
      <div className="mb-4">
        <span className="mb-2 block text-sm font-medium text-gray-700">保存到</span>
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
            <label htmlFor="wiki-select" className="mb-1 block text-sm font-medium text-gray-700">
              选择知识库
            </label>
            <select
              id="wiki-select"
              value={selectedWikiId}
              onChange={e => setSelectedWikiId(e.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">请选择知识库</option>
              {wikis.map(wiki => (
                <option key={wiki.id} value={wiki.id}>
                  {wiki.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 标签 */}
      {savePreferences.includeTags && (
        <div className="mb-4">
          <label htmlFor="tag-input" className="mb-1 block text-sm font-medium text-gray-700">
            标签
          </label>
          <div className="mb-2 flex">
            <Input
              id="tag-input"
              type="text"
              value={currentTag}
              onChange={e => setCurrentTag(e.target.value)}
              placeholder="添加标签"
              className="flex-1 rounded-r-none"
              onKeyPress={e => {
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
              <div
                key={tag}
                className="bg-secondary text-secondary-foreground flex items-center rounded-full px-3 py-1 text-sm">
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-muted-foreground hover:text-foreground ml-1 h-auto p-0"
                  aria-label={`删除标签 ${tag}`}>
                  &times;
                </Button>
              </div>
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
