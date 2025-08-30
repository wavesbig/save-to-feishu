/**
 * 飞书API服务类
 * 封装与飞书开放平台的交互
 */
import { feishuRequest } from './feishu-request.js';
import type {
  // FeishuDocument,
  // FeishuNote,
  // FeishuUser,
  FeishuWiki,
  // SaveContent,
  // SaveHistory,
  // SaveTarget,
  // 创建文档的请求数据类型
  CreateDocumentData,
  CreateWikiDocumentData,
  CreateNoteData,
} from '../types/feishu.js';

/**
 * 获取用户的文档列表
 */
export const getDocuments = async () => await feishuRequest.get('/drive/v1/recent_used_docs');

/**
 * 获取用户的知识库列表
 */
export const getWikis = async () => await feishuRequest.get<FeishuWiki[]>('/wiki/v2/spaces');

/**
 * 获取用户的便签列表
 */
export const getNotes = async () => await feishuRequest.get('/bitable/v1/apps/notes');

/**
 * 创建文档
 */
export const createDocument = async (data: CreateDocumentData) => await feishuRequest.post('/docx/v1/documents', data);

/**
 * 创建知识库文档
 */
export const createWikiDocument = async (wikiId: string, data: CreateWikiDocumentData) =>
  await feishuRequest.post(`/wiki/v2/spaces/${wikiId}/nodes`, data);

/**
 * 创建便签
 */
export const createNote = async (data: CreateNoteData) => await feishuRequest.post('/bitable/v1/apps/notes', data);

/**
 * 清除应用令牌
 */
export const logout = async () => await feishuRequest.clearTokens();
