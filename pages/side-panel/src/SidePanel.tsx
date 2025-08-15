import '@src/SidePanel.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { feishuStorage } from '@extension/storage';
import { Button, ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { useEffect, useState } from 'react';
import type { SaveHistory, FeishuUser } from '@extension/shared';
import type React from 'react';

const SidePanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<FeishuUser | null>(null);
  const [history, setHistory] = useState<SaveHistory[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  const { saveHistory } = useStorage(feishuStorage);

  // 初始化
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // 获取当前用户信息
        const userResponse = await chrome.runtime.sendMessage({ action: 'feishu_get_user' });
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data.user);
        }

        // 获取保存历史
        if (saveHistory) {
          setHistory(saveHistory);
        }
      } catch (error) {
        console.error('初始化失败:', error);
        setError('初始化失败');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [saveHistory]);

  // 处理清空历史
  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      await feishuStorage.set({
        ...(await feishuStorage.get()),
        saveHistory: [],
      });
      setHistory([]);
    } catch (error) {
      console.error('清空历史失败:', error);
      setError('清空历史失败');
    } finally {
      setIsClearing(false);
    }
  };

  // 处理打开链接
  const handleOpenUrl = (url: string) => {
    chrome.tabs.create({ url });
  };

  // 格式化时间
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleString('zh-CN');

  // 获取目标类型显示名称
  const getTargetDisplayName = (target: string) => {
    switch (target) {
      case 'doc':
        return '文档';
      case 'wiki':
        return '知识库';
      case 'note':
        return '便签';
      default:
        return target;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* 头部 */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src={chrome.runtime.getURL('icon-34.png')} alt="Save to Feishu" className="mr-2 h-6 w-6" />
            <h1 className="text-lg font-bold">保存历史</h1>
          </div>
          {user && (
            <div className="flex items-center">
              <img src={user.avatar_url} alt={user.name} className="mr-2 h-6 w-6 rounded-full" />
              <span className="text-sm text-gray-600">{user.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive m-4 rounded-md border p-3">
          {error}
        </div>
      )}

      {/* 操作栏 */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">共 {history.length} 条记录</span>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              disabled={isClearing}
              className="text-red-600 hover:text-red-700">
              {isClearing ? '清空中...' : '清空历史'}
            </Button>
          )}
        </div>
      </div>

      {/* 历史列表 */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-16 w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500">暂无保存记录</p>
              <p className="text-sm text-gray-400">开始保存网页内容到飞书吧！</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {history
              .sort((a, b) => b.saveTime - a.saveTime)
              .map(item => (
                <div key={item.id} className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <button
                      className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
                      onClick={() => handleOpenUrl(item.url)}
                      title="点击打开原网页">
                      {item.title}
                    </button>
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      {getTargetDisplayName(item.target)}
                    </span>
                  </div>
                  <p className="mb-2 text-xs text-gray-500" title={item.url}>
                    {item.url.length > 50 ? `${item.url.substring(0, 50)}...` : item.url}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{formatTime(item.saveTime)}</span>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
