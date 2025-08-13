import { useStorage } from '@extension/shared';
import { feishuStorage } from '@extension/storage';
import { cn } from '@extension/ui';
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
                    content: result.result,
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
        <img src={chrome.runtime.getURL('icon-128.png')} alt="Save to Feishu" className="mb-4 h-16 w-16" />
        <h1 className="mb-6 text-xl font-bold">保存到飞书</h1>

        {error && <div className="mb-4 w-full rounded bg-red-100 p-2 text-center text-red-700">{error}</div>}

        <button
          className="w-full rounded-lg bg-[#2E6EDF] px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600"
          onClick={handleAuth}
          disabled={isLoading}>
          {isLoading ? '正在授权...' : '登录飞书账号'}
        </button>
      </div>
    );
  }

  // 渲染保存成功界面
  if (saveSuccess) {
    return (
      <div className="flex min-h-[300px] min-w-[350px] flex-col items-center justify-center p-6">
        <div className="mb-4 text-green-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold">保存成功</h2>
        <p className="mb-4 text-gray-600">内容已成功保存到飞书</p>
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
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
            退出
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && <div className="mb-4 rounded bg-red-100 p-2 text-red-700">{error}</div>}

      {/* 内容编辑 */}
      <div className="mb-4">
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
          标题
        </label>
        <input
          id="title"
          type="text"
          value={pageInfo.title}
          onChange={e => setPageInfo({ ...pageInfo, title: e.target.value })}
          className="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="url" className="mb-1 block text-sm font-medium text-gray-700">
          URL
        </label>
        <input
          id="url"
          type="text"
          value={pageInfo.url}
          readOnly
          className="w-full rounded border border-gray-300 bg-gray-50 p-2"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="content" className="mb-1 block text-sm font-medium text-gray-700">
          内容预览
        </label>
        <textarea
          id="content"
          value={pageInfo.content}
          onChange={e => setPageInfo({ ...pageInfo, content: e.target.value })}
          className="h-24 w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 保存选项 */}
      <div className="mb-4">
        <span className="mb-2 block text-sm font-medium text-gray-700">保存到</span>
        <div className="mb-2 flex space-x-2">
          <button
            className={cn(
              'rounded px-3 py-1 text-sm font-medium',
              selectedTarget === 'doc' ? 'bg-[#2E6EDF] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
            onClick={() => setSelectedTarget('doc')}>
            文档
          </button>
          <button
            className={cn(
              'rounded px-3 py-1 text-sm font-medium',
              selectedTarget === 'wiki' ? 'bg-[#2E6EDF] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
            onClick={() => setSelectedTarget('wiki')}>
            知识库
          </button>
          <button
            className={cn(
              'rounded px-3 py-1 text-sm font-medium',
              selectedTarget === 'note' ? 'bg-[#2E6EDF] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
            onClick={() => setSelectedTarget('note')}>
            便签
          </button>
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
              className="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
            <input
              id="tag-input"
              type="text"
              value={currentTag}
              onChange={e => setCurrentTag(e.target.value)}
              placeholder="添加标签"
              className="flex-1 rounded-l border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button onClick={handleAddTag} className="rounded-r bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300">
              添加
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <div key={tag} className="flex items-center rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-700">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                  aria-label={`删除标签 ${tag}`}>
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 保存按钮 */}
      <div className="mt-6">
        <button
          className="w-full rounded bg-[#2E6EDF] px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          onClick={handleSave}
          disabled={isSaving || (selectedTarget === 'wiki' && !selectedWikiId)}>
          {isSaving ? '正在保存...' : '保存到飞书'}
        </button>
      </div>
    </div>
  );
};

export default SaveToFeishu;
