import { useEffect } from 'react';
import { ExternalToast, toast } from 'sonner';
import { onUIMessage } from '@extension/shared/lib/message/message';
import { MessageType } from '@extension/shared';

/**
 * 基于Sonner的Toast消息监听Hook
 * 监听Chrome消息并使用sonner显示toast通知
 */
export const useSonnerToast = () => {
  useEffect(() => {
    // 监听后台推送
    onUIMessage(MessageType.SHOW_TOAST, payload => {
      console.log('🚀 ~ onUIMessage ~ payload:', payload);
      const { type = 'info', message: content, data } = payload;
      const { description, actionText, actionUrl } = data || {};

      const toastOptions: ExternalToast = {
        description,
        action: {
          label: actionText,
          onClick: () => {
            if (actionUrl) {
              chrome.tabs.create({
                url: actionUrl,
              });
            }
          },
        },
      };

      // 根据消息类型调用对应的sonner方法
      switch (type) {
        case 'success':
          toast.success(content, toastOptions);
          break;
        case 'error':
          toast.error(content, toastOptions);
          break;
        case 'warning':
          toast.warning(content, toastOptions);
          break;
        case 'info':
        default:
          toast.info(content, toastOptions);
          break;
      }
    });
  }, []);
};
