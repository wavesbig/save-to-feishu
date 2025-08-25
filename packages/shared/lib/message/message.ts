import type { MessageType, MessagePayloadMap, MessageResponseMap } from '../types/message.js';

/**
 * 普通消息（无需响应）
 */
export const sendMessage = <T extends MessageType>(type: T, payload: MessagePayloadMap[T]): void => {
  chrome.runtime.sendMessage({ type, payload, request: false });
};

/**
 * 请求消息（需要响应）
 */
export const sendRequest = <T extends MessageType>(
  type: T,
  payload: MessagePayloadMap[T],
): Promise<MessageResponseMap[T]> =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload, request: true }, res => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
      resolve(res as MessageResponseMap[T]);
    });
  });
