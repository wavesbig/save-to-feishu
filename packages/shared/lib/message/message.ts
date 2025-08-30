/* eslint-disable @typescript-eslint/no-explicit-any */

import type { MessageType, MessagePayloadMap, MessageResponseMap } from '../types/message.js';

//
// ====== UI -> Background ======
//

// 发送 Request（需要返回值）
const sendRequest = async <K extends MessageType>(
  type: K,
  payload: MessagePayloadMap[K],
): Promise<MessageResponseMap[K]> => {
  const msg = { kind: 'REQUEST' as const, type, payload };
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, res => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(res);
      }
    });
  });
};

// 发送 Event（单向通知，无返回值）
const sendEvent = <K extends MessageType>(type: K, payload: MessagePayloadMap[K]): void => {
  const msg = { kind: 'EVENT' as const, type, payload };
  chrome.runtime.sendMessage(msg);
};

//
// ====== Background 侧处理 ======
//

type RequestHandler<K extends MessageType> = (
  payload: MessagePayloadMap[K],
) => Promise<MessageResponseMap[K]> | MessageResponseMap[K];

type EventHandler<K extends MessageType> = (payload: MessagePayloadMap[K]) => void;

const requestHandlers: Partial<Record<MessageType, RequestHandler<any>>> = {};
const eventHandlers: Partial<Record<MessageType, EventHandler<any>>> = {};

// 注册 Request handler（UI 调用 sendRequest 会触发）
const registerRequestHandler = <K extends MessageType>(type: K, handler: RequestHandler<K>) => {
  requestHandlers[type] = handler;
};

// 注册 Event handler（UI 调用 sendEvent 会触发）
const registerEventHandler = <K extends MessageType>(type: K, handler: EventHandler<K>) => {
  eventHandlers[type] = handler;
};

// Background 挂一次全局监听
if (chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse): boolean | void => {
    if (msg.kind === 'REQUEST') {
      const handler = requestHandlers[msg.type as MessageType];
      if (!handler) return;
      Promise.resolve(handler(msg.payload))
        .then(sendResponse)
        .catch(err => sendResponse({ error: err.message }));
      return true;
    }

    if (msg.kind === 'EVENT') {
      const handler = eventHandlers[msg.type as MessageType];
      if (handler) handler(msg.payload);
    }
  });
}

//
// ====== Background -> UI ======
//

// UI handlers（只在 UI 页面里用）
const uiHandlers: Partial<Record<MessageType, EventHandler<any>>> = {};

// UI 注册监听 Background 推送的事件
const onUIMessage = <K extends MessageType>(type: K, handler: EventHandler<K>) => {
  uiHandlers[type] = handler;
};

// UI 挂一次监听
if (chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.kind === 'EVENT') {
      const handler = uiHandlers[msg.type as MessageType];
      if (handler) handler(msg.payload);
    }
  });
}

// Background 主动发消息到 UI
const notifyUI = <K extends MessageType>(type: K, payload: MessagePayloadMap[K]) => {
  chrome.runtime.sendMessage({ kind: 'EVENT', type, payload });
};

export { sendRequest, sendEvent, registerRequestHandler, registerEventHandler, onUIMessage, notifyUI };
