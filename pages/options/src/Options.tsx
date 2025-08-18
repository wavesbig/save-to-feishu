import { useStorage } from '@extension/shared';
import { feishuStorage } from '@extension/storage';
import { Button } from '@extension/ui';
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

  // 飞书应用配置
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

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

          // 设置默认值
          if (savePreferences) {
            setDefaultTarget(savePreferences.defaultTarget);
            setDefaultWikiId(savePreferences.defaultWikiId || '');
            setIncludeTags(savePreferences.includeTags);
            setIncludeScreenshot(savePreferences.includeScreenshot);
          }

          // 加载飞书应用配置
          const { feishuAppId, feishuAppSecret } = await chrome.storage.local.get(['feishuAppId', 'feishuAppSecret']);
          setAppId(feishuAppId || '');
          setAppSecret(feishuAppSecret || '');
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
      await feishuStorage.set({
        ...(await feishuStorage.get()),
        savePreferences: {
          defaultTarget,
          defaultWikiId: defaultWikiId || undefined,
          includeTags,
          includeScreenshot,
        },
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

  // 处理保存飞书应用配置
  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigSuccess(false);
    setError(null);

    try {
      // 保存到本地存储
      await chrome.storage.local.set({
        feishuAppId: appId.trim(),
        feishuAppSecret: appSecret.trim(),
      });

      setConfigSuccess(true);

      // 3秒后隐藏成功提示
      setTimeout(() => {
        setConfigSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('保存配置失败:', error);
      setError('保存配置失败');
    } finally {
      setConfigSaving(false);
    }
  };

  // 渲染登录界面
  if (!user) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center p-6">
        <div className="mb-4 rounded-full bg-blue-100 p-3">
          <img src={chrome.runtime.getURL('icon-128.png')} alt="Save to Feishu" className="h-12 w-12" />
        </div>
        <h1 className="mb-6 text-xl font-bold">保存到飞书 - 设置11</h1>

        {error && (
          <div className="border-destructive/50 bg-destructive/10 text-destructive mb-4 w-full max-w-md rounded-md border p-3 text-center">
            {error}
          </div>
        )}

        <Button className="w-full max-w-md" onClick={handleAuth} disabled={isLoading}>
          {isLoading ? '正在授权...' : '登录飞书账号'}
        </Button>
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

      {/* 成功提示 */}
      {saveSuccess && (
        <div className="mb-4 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-green-700">设置已保存</div>
      )}

      {/* 配置成功提示 */}
      {configSuccess && (
        <div className="mb-4 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-green-700">
          飞书应用配置已保存
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-medium">飞书应用配置</h2>
        <p className="mb-4 text-sm text-gray-600">
          请在飞书开放平台创建应用后，填入应用的 App ID 和 App Secret。
          <a
            href="https://open.feishu.cn/app"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-blue-600 hover:text-blue-800">
            前往飞书开放平台 →
          </a>
        </p>

        {/* App ID */}
        <div className="mb-4">
          <label htmlFor="app-id" className="mb-2 block text-sm font-medium text-gray-700">
            App ID
          </label>
          <input
            id="app-id"
            type="text"
            value={appId}
            onChange={e => setAppId(e.target.value)}
            placeholder="请输入飞书应用的 App ID"
            className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* App Secret */}
        <div className="mb-4">
          <label htmlFor="app-secret" className="mb-2 block text-sm font-medium text-gray-700">
            App Secret
          </label>
          <input
            id="app-secret"
            type="password"
            value={appSecret}
            onChange={e => setAppSecret(e.target.value)}
            placeholder="请输入飞书应用的 App Secret"
            className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* 保存配置按钮 */}
        <div className="mb-6">
          <Button
            onClick={handleSaveConfig}
            disabled={configSaving || !appId.trim() || !appSecret.trim()}
            className="mr-2">
            {configSaving ? '正在保存...' : '保存配置'}
          </Button>
          <span className="text-xs text-gray-500">保存后需要重新授权登录</span>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-white p-6 shadow">
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
                className="border-primary text-primary ring-offset-background focus-visible:ring-ring h-4 w-4 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="border-primary text-primary ring-offset-background focus-visible:ring-ring h-4 w-4 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="border-primary text-primary ring-offset-background focus-visible:ring-ring h-4 w-4 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="border-primary text-primary ring-offset-background focus-visible:ring-ring h-4 w-4 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span className="ml-2">启用标签功能</span>
            </label>
            <label htmlFor="include-screenshot" className="inline-flex items-center">
              <input
                id="include-screenshot"
                type="checkbox"
                checked={includeScreenshot}
                onChange={e => setIncludeScreenshot(e.target.checked)}
                className="border-primary text-primary ring-offset-background focus-visible:ring-ring h-4 w-4 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span className="ml-2">保存时包含页面截图</span>
            </label>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="mt-6">
          <Button onClick={handleSaveSettings} disabled={isSaving || (defaultTarget === 'wiki' && !defaultWikiId)}>
            {isSaving ? '正在保存...' : '保存设置'}
          </Button>
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
