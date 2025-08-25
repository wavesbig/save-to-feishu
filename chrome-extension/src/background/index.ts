import 'webextension-polyfill';
// import { getWikis, MessageType, createDocument, createWikiDocument, createNote } from '@extension/shared';
import { startMessageListener } from '@extension/shared/lib/message/messageHandler';
// import { exampleThemeStorage } from '@extension/storage';
// import type {
//   // ChromeMessage,
//   MessageResponse,
//   SaveContent,
//   CreateDocumentData,
//   CreateWikiDocumentData,
//   FeishuApiResponse,
//   CreateNoteData,
// } from '@extension/shared';

// registerHandler(MessageType.GET_WIKIS, async () => await getWikis());

// registerHandler('updateUser', async (payload) => {
//   return await apiUser.updateUserInfo(payload);
// });

startMessageListener();

/**
 * 保存内容到飞书
 */
// const saveContent = async (data: SaveContent) => {
//   const { title, url, content, target, targetId } = data;
//   let result;

//   if (target === 'doc') {
//     // 构建文档数据结构
//     const docData: CreateDocumentData = {
//       title,
//       content: {
//         blocks: [
//           {
//             block_type: 'text',
//             text: {
//               elements: [
//                 {
//                   text_run: {
//                     content: url,
//                     text_element_style: {
//                       link: {
//                         url: url,
//                       },
//                     },
//                   },
//                 },
//               ],
//             },
//           },
//           {
//             block_type: 'text',
//             text: {
//               elements: [
//                 {
//                   text_run: {
//                     content: content,
//                   },
//                 },
//               ],
//             },
//           },
//         ],
//       },
//     };
//     result = await createDocument(docData);
//   } else if (target === 'wiki') {
//     if (targetId) {
//       // 构建知识库文档数据结构
//       const wikiData: CreateWikiDocumentData = {
//         title,
//         obj_type: 'doc',
//         content: `<p><a href="${url}">${url}</a></p><p>${content}</p>`,
//       };
//       result = await createWikiDocument(targetId, wikiData);
//     } else {
//       throw new Error('未指定知识库ID');
//     }
//   } else if (target === 'note') {
//     // 构建便签数据结构
//     const noteData: CreateNoteData = {
//       title,
//       body: {
//         content: `${url}\n\n${content}`,
//       },
//     };
//     result = await createNote(noteData);
//   } else {
//     throw new Error('不支持的目标类型');
//   }

//   return result;
// };

// exampleThemeStorage.get().then(theme => {
//   console.log('theme', theme);
// });

// 监听来自内容脚本和其他页面的消息
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log('🚀 ~ message:', message);

//   // const handleAsyncResponse = async (asyncFn: () => Promise<FeishuApiResponse>) => {
//   //   try {
//   //     const result = await asyncFn();
//   //     const response: MessageResponse = {
//   //       success: true,
//   //       data: result,
//   //       timestamp: Date.now(),
//   //     };
//   //     sendResponse(response);
//   //   } catch (error) {
//   //     const response: MessageResponse = {
//   //       success: false,
//   //       error: error instanceof Error ? error.message : '未知错误',
//   //       timestamp: Date.now(),
//   //     };
//   //     sendResponse(response);
//   //   }
//   // };

//   // 处理基础功能消息
//   // if (message.action === 'open_popup') {
//   //   // 打开扩展的弹出窗口
//   //   chrome.action.openPopup();
//   //   sendResponse({ success: true, timestamp: Date.now() });
//   //   return true;
//   // }

//   // if (message.action === 'get_page_content') {
//   //   // 处理获取页面内容的请求
//   //   if (sender.tab && sender.tab.id) {
//   //     chrome.tabs.sendMessage(sender.tab.id, { action: 'get_page_content' }, response => {
//   //       sendResponse(response);
//   //     });
//   //     return true;
//   //   }
//   // }

//   // 处理飞书 API 消息
//   // if (message.action === MessageType.GET_WIKIS) {
//   //   handleAsyncResponse(() => getWikis());
//   //   return true;
//   // }

//   // if (message.action === MessageType.SAVE_TO_FEISHU) {
//   //   handleAsyncResponse(() => saveContent(message.data));
//   //   return true;
//   // }

//   // if (message.action === 'feishu_get_documents') {
//   //   handleAsyncResponse(() => getDocuments());
//   //   return true;
//   // }

//   // if (message.action === 'feishu_get_notes') {
//   //   handleAsyncResponse(() => getNotes());
//   //   return true;
//   // }

//   // if (message.action === 'feishu_logout') {
//   //   handleAsyncResponse(() => logout());
//   //   return true;
//   // }

//   return false;
// });
