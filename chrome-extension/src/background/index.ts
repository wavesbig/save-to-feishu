import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import './feishu-service';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

// 监听来自内容脚本和其他页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'open_popup') {
    // 打开扩展的弹出窗口
    chrome.action.openPopup();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'get_page_content') {
    // 处理获取页面内容的请求
    if (sender.tab && sender.tab.id) {
      chrome.tabs.sendMessage(sender.tab.id, { action: 'get_page_content' }, response => {
        sendResponse(response);
      });
      return true;
    }
  }

  // 其他消息由feishu-service.ts处理
  return false;
});

console.log('Save to Feishu Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
