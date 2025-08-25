/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MessageType, MessagePayloadMap, MessageResponseMap } from '../types/message.js';

type Handler<T extends MessageType> = (
  payload: MessagePayloadMap[T],
) => MessageResponseMap[T] | Promise<MessageResponseMap[T]>;

const handlers: Partial<{ [K in MessageType]: Handler<K> }> = {};

export const registerHandler = <T extends MessageType>(type: T, handler: Handler<T>) => {
  handlers[type] = handler;
};

export const startMessageListener = () => {
  chrome.runtime.onMessage.addListener(
    (message: { type: MessageType; payload: any; request?: boolean }, sender, sendResponse) => {
      if (message.request) {
        const handler = handlers[message.type];
        if (!handler) {
          console.warn(`未找到处理器: ${message.type}`);
          sendResponse({});
          return;
        }

        const result = handler(message.payload);
        if (result instanceof Promise) result.then(sendResponse);
        else sendResponse(result);

        return true; // 异步响应
      } else {
        // 普通消息（通知）
        const handler = handlers[message.type];
        if (handler) handler(message.payload);
      }
    },
  );
};
