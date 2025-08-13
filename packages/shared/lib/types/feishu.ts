/**
 * 飞书相关类型定义
 */

// 用户信息
export interface FeishuUser {
  user_id: string;
  name: string;
  avatar_url: string;
  email?: string;
}

// 保存目标类型
export type SaveTarget = 'doc' | 'wiki' | 'note';

// 文档类型
export interface FeishuDocument {
  obj_type: 'doc' | 'sheet' | 'bitable' | 'mindnote' | 'wiki';
  obj_token: string;
  title: string;
  url: string;
}

// 知识库类型
export interface FeishuWiki {
  id: string;
  name: string;
  description?: string;
}

// 便签类型
export interface FeishuNote {
  id: string;
  title: string;
  content: string;
  created_time: number;
  updated_time: number;
}

// 保存内容类型
export interface SaveContent {
  title: string;
  url: string;
  content: string;
  tags?: string[];
  target?: SaveTarget;
  targetId?: string;
}

// 保存历史记录类型
export interface SaveHistory {
  id: string;
  title: string;
  url: string;
  target: SaveTarget;
  targetId: string;
  saveTime: number;
  tags?: string[];
}

// 保存偏好设置类型
export interface SavePreferences {
  defaultTarget: SaveTarget;
  defaultWikiId?: string;
  includeTags: boolean;
  includeScreenshot: boolean;
}
