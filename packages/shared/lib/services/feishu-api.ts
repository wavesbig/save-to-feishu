/**
 * 飞书API服务类
 * 封装与飞书开放平台的交互
 */
import { feishuRequest } from './feishu-request.js';
// import type {
//   FeishuDocument,
//   FeishuNote,
//   FeishuUser,
//   FeishuWiki,
//   SaveContent,
//   SaveHistory,
//   SaveTarget,
// } from '../types/feishu.js';

/**
 * 获取用户的文档列表
 */
export const getDocuments = async () => await feishuRequest.get('/drive/v1/recent_used_docs');

/**
 * 获取用户的知识库列表
 */
export const getWikis = async () => await feishuRequest.get('/wiki/v2/spaces');

/**
 * 获取用户的便签列表
 */
export const getNotes = async () => await feishuRequest.get('/bitable/v1/apps/notes');

/**
 * 创建文档
 */
export const createDocument = async (title: string, url: string, content: string) =>
  await feishuRequest.post('/doc/v2/create', {
    title,
    content: `<p><a href="${url}">${url}</a></p><p>${content}</p>`,
  });

/**
 * 创建知识库文档
 */
export const createWikiDocument = async (wikiId: string, title: string, url: string, content: string) =>
  await feishuRequest.post(`/wiki/v2/spaces/${wikiId}/nodes`, {
    title,
    obj_type: 'doc',
    content: `<p><a href="${url}">${url}</a></p><p>${content}</p>`,
  });

/**
 * 创建便签
 */
export const createNote = async (title: string, url: string, content: string) =>
  await feishuRequest.post('/bitable/v1/apps/notes', {
    title,
    body: {
      content: `${url}\n\n${content}`,
    },
  });

/**
 * 保存内容到飞书
 */
export const saveContent = async (data: {
  title: string;
  url: string;
  content: string;
  target: 'doc' | 'wiki' | 'note';
  targetId?: string;
  tags?: string[];
}) => {
  const { title, url, content, target, targetId } = data;
  let result;

  // eslint-disable-next-line no-useless-catch
  try {
    switch (target) {
      case 'doc':
        result = await createDocument(title, url, content);
        break;
      case 'wiki':
        if (targetId) {
          result = await createWikiDocument(targetId, title, url, content);
        } else {
          throw new Error('未指定知识库ID');
        }
        break;
      case 'note':
        result = await createNote(title, url, content);
        break;
      default:
        throw new Error('不支持的目标类型');
    }

    // if (result) {
    //   // 保存历史记录
    //   const { saveHistory = [] } = await chrome.storage.local.get('saveHistory');
    //   saveHistory.unshift({
    //     id: result.obj_token || result.node_token || result.note_id,
    //     title,
    //     url,
    //     target,
    //     targetId: targetId || result.obj_token || result.node_token || result.note_id,
    //     saveTime: Date.now(),
    //     tags: tags || [],
    //   });

    //   // 限制历史记录数量为50条
    //   if (saveHistory.length > 50) {
    //     saveHistory.pop();
    //   }

    //   await chrome.storage.local.set({ saveHistory });
    // }

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * 清除应用令牌
 */
export const logout = async () => await feishuRequest.clearTokens();
