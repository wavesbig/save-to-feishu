import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  MessageType,
  ChromeMessage,
  ShowToastResponse,
  ShowToastMessage,
} from '@extension/shared/lib/types/chrome-runtime';

/**
 * 基于Sonner的Toast消息监听Hook
 * 监听Chrome消息并使用sonner显示toast通知
 */
export const useSonnerToast = () => {
  useEffect(() => {
    const handleMessage = (
      message: ChromeMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: ShowToastResponse) => void,
    ) => {
      if (message.action === MessageType.SHOW_TOAST) {
        const toastMessage = message as ShowToastMessage;
        const { type = 'info', message: content, data } = toastMessage;

        // 根据消息类型调用对应的sonner方法
        switch (type) {
          case 'success':
            toast.success(content, data);
            break;
          case 'error':
            toast.error(content, data);
            break;
          case 'warning':
            toast.warning(content, data);
            break;
          case 'info':
          default:
            toast.info(content, data);
            break;
        }

        sendResponse({ success: true });
      }
    };

    // 检查是否在Chrome扩展环境中
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);

      // 清理函数
      return () => {
        if (chrome.runtime && chrome.runtime.onMessage) {
          chrome.runtime.onMessage.removeListener(handleMessage);
        }
      };
    }
    return undefined;
  }, []);
};

/**
 * 手动显示toast的工具函数
 */
export const showToast = {
  success: (message: string, duration?: number) => toast.success(message, { duration }),
  error: (message: string, duration?: number) => toast.error(message, { duration }),
  warning: (message: string, duration?: number) => toast.warning(message, { duration }),
  info: (message: string, duration?: number) => toast.info(message, { duration }),
};
