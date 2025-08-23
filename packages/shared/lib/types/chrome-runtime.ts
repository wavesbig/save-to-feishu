/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Chrome Runtime 消息传递类型定义
 */
interface Action {
  label: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  actionButtonStyle?: React.CSSProperties;
}

// 消息类型枚举
export enum MessageType {
  SAVE_TO_FEISHU = 'SAVE_TO_FEISHU',
  GET_CURRENT_TAB = 'GET_CURRENT_TAB',
  OPEN_POPUP = 'OPEN_POPUP',
  CONTENT_SCRIPT_READY = 'CONTENT_SCRIPT_READY',
  BACKGROUND_READY = 'BACKGROUND_READY',
  SAVE_SUCCESS = 'SAVE_SUCCESS',
  SAVE_ERROR = 'SAVE_ERROR',
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  SHOW_TOAST = 'SHOW_TOAST',
}

// 基础消息接口
export interface BaseMessage {
  action: MessageType;
  timestamp?: number;
  requestId?: string;
}

// 保存到飞书消息
export interface SaveToFeishuMessage extends BaseMessage {
  action: MessageType.SAVE_TO_FEISHU;
  data: {
    title: string;
    url: string;
    content: string;
    tags?: string[];
    target?: 'doc' | 'wiki' | 'note';
    targetId?: string;
  };
}

// 获取当前标签页消息
export interface GetCurrentTabMessage extends BaseMessage {
  action: MessageType.GET_CURRENT_TAB;
}

// 打开弹窗消息
export interface OpenPopupMessage extends BaseMessage {
  action: MessageType.OPEN_POPUP;
}

// Content Script 就绪消息
export interface ContentScriptReadyMessage extends BaseMessage {
  action: MessageType.CONTENT_SCRIPT_READY;
}

// Background Script 就绪消息
export interface BackgroundReadyMessage extends BaseMessage {
  action: MessageType.BACKGROUND_READY;
}

// 保存成功消息
export interface SaveSuccessMessage extends BaseMessage {
  action: MessageType.SAVE_SUCCESS;
  data: {
    title: string;
    url: string;
    target: string;
    targetId: string;
  };
}

// 保存错误消息
export interface SaveErrorMessage extends BaseMessage {
  action: MessageType.SAVE_ERROR;
  data: {
    error: string;
    details?: any;
  };
}

// 获取设置消息
export interface GetSettingsMessage extends BaseMessage {
  action: MessageType.GET_SETTINGS;
}

// 更新设置消息
export interface UpdateSettingsMessage extends BaseMessage {
  action: MessageType.UPDATE_SETTINGS;
  data: {
    settings: Record<string, any>;
  };
}

// 显示 Toast 消息
export interface ShowToastMessage extends BaseMessage {
  action: MessageType.SHOW_TOAST;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  data?: {
    description?: (() => React.ReactNode) | React.ReactNode;
    action?: Action | React.ReactNode;
    cancel?: Action | React.ReactNode;
  };
}

// Toast 响应类型定义
export interface ShowToastResponse {
  success: boolean;
}

// 联合消息类型
export type ChromeMessage =
  | SaveToFeishuMessage
  | GetCurrentTabMessage
  | OpenPopupMessage
  | ContentScriptReadyMessage
  | BackgroundReadyMessage
  | SaveSuccessMessage
  | SaveErrorMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | ShowToastMessage;

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

// Chrome Runtime 消息监听器类型
export type MessageListener = (
  message: ChromeMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void,
) => boolean | void;

// Chrome Runtime 发送消息函数类型
export type SendMessage = <T extends ChromeMessage>(
  message: T,
  options?: {
    tabId?: number;
    frameId?: number;
  },
) => Promise<MessageResponse>;

// Chrome Runtime 消息发送器工具类型
export interface ChromeMessageSender {
  sendToBackground: <T extends ChromeMessage>(message: T) => Promise<MessageResponse>;
  sendToContentScript: <T extends ChromeMessage>(message: T, tabId?: number) => Promise<MessageResponse>;
  sendToPopup: <T extends ChromeMessage>(message: T) => Promise<MessageResponse>;
}

// Chrome Runtime 消息接收器工具类型
export interface ChromeMessageReceiver {
  onMessage: (listener: MessageListener) => void;
  removeListener: (listener: MessageListener) => void;
  removeAllListeners: () => void;
}
