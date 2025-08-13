import { useStorage } from '@extension/shared';
import { feishuStorage } from '@extension/storage';
import { useEffect, useState } from 'react';
import type { FeishuUser, FeishuWiki, SaveTarget } from '@extension/shared';
import type React from 'react';

const Options: React.FC = () => {
  // 状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<FeishuUser | null>(null);
  const [wikis, setWikis] = useState<FeishuWiki[]>([]);
  const [defaultTarget, setDefaultTarget] = useState<SaveTarget>('doc');
  const [defaultWikiId, setDefaultWikiId] = useState<string>('');
  const [includeTags, setIncludeTags] = useState(true);
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 获取保存偏好设置
  const { savePreferences, setSavePreferences } = useStorage(feishuStorage);

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

          // 设置默认值
          if (savePreferences) {
            setDefaultTarget(savePreferences.defaultTarget);
            setDefaultWikiId(savePreferences.defaultWikiId || '');
            setIncludeTags(savePreferences.includeTags);
            setIncludeScreenshot(savePreferences.includeScreenshot);
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

  // 处理保存设置
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await setSavePreferences({
        defaultTarget,
        defaultWikiId: defaultWikiId || undefined,
        includeTags,
        includeScreenshot,
      });

      setSaveSuccess(true);

      // 3秒后隐藏成功提示
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('保存设置失败:', error);
      setError('保存设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染登录界面
  if (!user) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center p-6">
        <img src={chrome.runtime.getURL('icon-128.png')} alt="Save to Feishu" className="mb-4 h-16 w-16" />
        <h1 className="mb-6 text-xl font-bold">保存到飞书 - 设置</h1>

        {error && <div className="mb-4 w-full max-w-md rounded bg-red-100 p-2 text-center text-red-700">{error}</div>}

        <button
          className="w-full max-w-md rounded-lg bg-[#2E6EDF] px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600"
          onClick={handleAuth}
          disabled={isLoading}>
          {isLoading ? '正在授权...' : '登录飞书账号'}
        </button>
      </div>
    );
  }

  // 渲染设置界面
  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <img src={chrome.runtime.getURL('icon-128.png')} alt="Save to Feishu" className="mr-3 h-10 w-10" />
          <h1 className="text-2xl font-bold">保存到飞书 - 设置</h1>
        </div>

        <div className="flex items-center">
          <img src={user.avatar_url} alt={user.name} className="mr-2 h-8 w-8 rounded-full" />
          <span className="mr-3 text-sm">{user.name}</span>
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
            退出
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}

      {/* 成功提示 */}
      {saveSuccess && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">设置已保存</div>}

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-medium">偏好设置</h2>

        {/* 默认保存目标 */}
        <div className="mb-6">
          <div className="mb-2 block text-sm font-medium text-gray-700">默认保存目标</div>
          <div className="flex space-x-4">
            <label htmlFor="target-doc" className="inline-flex items-center">
              <input
                id="target-doc"
                type="radio"
                name="defaultTarget"
                value="doc"
                checked={defaultTarget === 'doc'}
                onChange={() => setDefaultTarget('doc')}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2">文档</span>
            </label>
            <label htmlFor="target-wiki" className="inline-flex items-center">
              <input
                id="target-wiki"
                type="radio"
                name="defaultTarget"
                value="wiki"
                checked={defaultTarget === 'wiki'}
                onChange={() => setDefaultTarget('wiki')}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2">知识库</span>
            </label>
            <label htmlFor="target-note" className="inline-flex items-center">
              <input
                id="target-note"
                type="radio"
                name="defaultTarget"
                value="note"
                checked={defaultTarget === 'note'}
                onChange={() => setDefaultTarget('note')}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2">便签</span>
            </label>
          </div>
        </div>

        {/* 默认知识库 */}
        {defaultTarget === 'wiki' && (
          <div className="mb-6">
            <label htmlFor="default-wiki" className="mb-2 block text-sm font-medium text-gray-700">
              默认知识库
            </label>
            <select
              id="default-wiki"
              value={defaultWikiId}
              onChange={e => setDefaultWikiId(e.target.value)}
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

        {/* 其他选项 */}
        <div className="mb-6">
          <div className="mb-2 block text-sm font-medium text-gray-700">其他选项</div>
          <div className="space-y-2">
            <label htmlFor="include-tags" className="inline-flex items-center">
              <input
                id="include-tags"
                type="checkbox"
                checked={includeTags}
                onChange={e => setIncludeTags(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600"
              />
              <span className="ml-2">启用标签功能</span>
            </label>
            <label htmlFor="include-screenshot" className="inline-flex items-center">
              <input
                id="include-screenshot"
                type="checkbox"
                checked={includeScreenshot}
                onChange={e => setIncludeScreenshot(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600"
              />
              <span className="ml-2">保存时包含页面截图</span>
            </label>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="mt-6">
          <button
            className="rounded bg-[#2E6EDF] px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            onClick={handleSaveSettings}
            disabled={isSaving || (defaultTarget === 'wiki' && !defaultWikiId)}>
            {isSaving ? '正在保存...' : '保存设置'}
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-medium">关于</h2>
        <p className="mb-2 text-gray-600">
          Save to Feishu 是一个浏览器扩展，可以帮助你快速保存网页内容到飞书文档、知识库或便签中。
        </p>
        <p className="text-gray-600">版本: 1.0.0</p>
      </div>
    </div>
  );
};

export default Options;
