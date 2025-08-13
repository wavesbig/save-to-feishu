import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import './feishu-service';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'open_popup') {
    // 打开扩展的弹出窗口
    chrome.action.openPopup();
    sendResponse({ success: true });
  }
  return true;
});

console.log('Save to Feishu Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
