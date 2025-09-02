//
// 定义消息种类：REQUEST（请求/响应）、EVENT（单向通知）
import type { BitableData, GetBitableRecordsParams } from './feishu.js';
import type { FeishuApiResponse } from '../services/feishu-request.js';

//
export type MessageKind = 'REQUEST' | 'EVENT';

// 消息类型枚举
export enum MessageType {
  // GET_SETTINGS = 'GET_SETTINGS',
  // UI -> Background：请求弹出 Toast
  SHOW_TOAST = 'SHOW_TOAST',

  // 获取多维表格记录
  GET_BITABLE_RECORDS = 'GET_BITABLE_RECORDS',
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

//
// 每个消息对应的 payload 参数
//
export interface MessagePayloadMap {
  [MessageType.SHOW_TOAST]: ShowToastMessagePayload;

  [MessageType.GET_BITABLE_RECORDS]: GetBitableRecordsParams;
}

//
// 每个消息对应的返回值（REQUEST 用）
// - EVENT 类型返回值通常是 void
//
export interface MessageResponseMap {
  SHOW_TOAST: void;
  [MessageType.GET_BITABLE_RECORDS]: FeishuApiResponse<BitableData>;
}

//
// 通用消息结构
//
export interface BaseMessage<K extends MessageKind, T extends MessageType> {
  kind: K;
  type: T;
  payload: MessagePayloadMap[T];
}

//
// 区分 Request 和 Event
//
export type RequestMessage<T extends MessageType> = BaseMessage<'REQUEST', T>;
export type EventMessage<T extends MessageType> = BaseMessage<'EVENT', T>;
