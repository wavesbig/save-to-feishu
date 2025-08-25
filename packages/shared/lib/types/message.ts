/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Chrome Runtime 消息传递类型定义
 */

// 消息类型枚举
export enum MessageType {
  // GET_SETTINGS = 'GET_SETTINGS',
  SHOW_TOAST = 'SHOW_TOAST',

  // SAVE_TO_FEISHU = 'SAVE_TO_FEISHU',
  // GET_WIKIS = 'GET_WIKIS',
}

// 基础消息接口
export interface BaseMessage<T = MessageType, R = any> {
  action: T;
  type: 'request' | 'event';
  payload?: R;
}
// 显示 Toast 消息
export interface ShowToastMessagePayload {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  data?: {
    description?: (() => React.ReactNode) | React.ReactNode;
    actionText?: React.ReactNode;
    actionUrl?: string;
    cancelText?: React.ReactNode;
  };
}

// 消息请求映射
export interface MessagePayloadMap {
  // [MessageType.GET_SETTINGS]: undefined;
  [MessageType.SHOW_TOAST]: BaseMessage<MessageType.SHOW_TOAST, ShowToastMessagePayload>;

  // [MessageType.SAVE_TO_FEISHU]: undefined;
  // [MessageType.GET_WIKIS]: undefined;
}

// 消息响应映射
export interface MessageResponseMap {
  // [MessageType.GET_SETTINGS]: undefined;
  [MessageType.SHOW_TOAST]: undefined;

  // [MessageType.SAVE_TO_FEISHU]: undefined;
  // [MessageType.GET_WIKIS]: undefined;
}

// 保存到飞书消息
// export interface SaveToFeishuMessage extends BaseMessage {
//   action: MessageType.SAVE_TO_FEISHU;
//   data: {
//     title: string;
//     url: string;
//     content: string;
//     tags?: string[];
//     target?: 'doc' | 'wiki' | 'note';
//     targetId?: string;
//   };
// }

// 获取知识库列表消息
// export interface GetWikisMessage extends BaseMessage {
//   action: MessageType.GET_WIKIS;
// }

// 获取当前标签页消息
// export interface GetCurrentTabMessage extends BaseMessage {
//   action: MessageType.GET_CURRENT_TAB;
// }

// 打开弹窗消息
// export interface OpenPopupMessage extends BaseMessage {
//   action: MessageType.OPEN_POPUP;
// }

// Content Script 就绪消息
// export interface ContentScriptReadyMessage extends BaseMessage {
//   action: MessageType.CONTENT_SCRIPT_READY;
// }

// // Background Script 就绪消息
// export interface BackgroundReadyMessage extends BaseMessage {
//   action: MessageType.BACKGROUND_READY;
// }

// 保存成功消息
// export interface SaveSuccessMessage extends BaseMessage {
//   action: MessageType.SAVE_SUCCESS;
//   data: {
//     title: string;
//     url: string;
//     target: string;
//     targetId: string;
//   };
// }

// 保存错误消息
// export interface SaveErrorMessage extends BaseMessage {
//   action: MessageType.SAVE_ERROR;
//   data: {
//     error: string;
//     details?: any;
//   };
// }

// Toast 响应类型定义
export interface ShowToastResponse {
  success: boolean;
}

// 消息响应类型
export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// 标签页信息类型
export interface TabInfo {
  id?: number;
  url?: string;
  title?: string;
  favIconUrl?: string;
  active?: boolean;
}
