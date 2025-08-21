import 'webextension-polyfill';
import { getDocuments, getWikis, getNotes, saveContent, logout } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

// 监听来自内容脚本和其他页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🚀 ~ message:', message);

  // 处理基础功能消息
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

  if (message.action === 'feishu_get_documents') {
    getDocuments().then(sendResponse);
    return true;
  }

  if (message.action === 'feishu_get_wikis') {
    getWikis().then(sendResponse);
    return true;
  }

  if (message.action === 'feishu_get_notes') {
    getNotes().then(sendResponse);
    return true;
  }

  if (message.action === 'feishu_save_content') {
    saveContent(message.data).then(sendResponse);
    return true;
  }

  if (message.action === 'feishu_logout') {
    logout().then(sendResponse);
    return true;
  }

  return false;
});
