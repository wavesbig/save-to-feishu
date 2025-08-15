import { sampleFunction } from '@src/sample-function';

console.log('[CEB] Save to Feishu content script loaded');

// 创建快捷保存按钮
const createSaveButton = () => {
  const button = document.createElement('div');
  button.id = 'save-to-feishu-btn';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="#2E6EDF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M17 21V13H7V21" stroke="#2E6EDF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M7 3V8H15" stroke="#2E6EDF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  // 设置按钮样式
  Object.assign(button.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '50px',
    height: '50px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(46, 110, 223, 0.3)',
    cursor: 'pointer',
    zIndex: '10000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    border: '2px solid #2E6EDF',
  });

  // 悬停效果
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
    button.style.backgroundColor = '#2E6EDF';
    const svg = button.querySelector('svg');
    if (svg) {
      const paths = svg.querySelectorAll('path');
      paths.forEach(path => path.setAttribute('stroke', '#ffffff'));
    }
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.backgroundColor = '#ffffff';
    const svg = button.querySelector('svg');
    if (svg) {
      const paths = svg.querySelectorAll('path');
      paths.forEach(path => path.setAttribute('stroke', '#2E6EDF'));
    }
  });

  // 点击事件
  button.addEventListener('click', () => {
    // 发送消息给background script打开popup
    chrome.runtime.sendMessage({ action: 'open_popup' });
  });

  return button;
};

// 获取页面内容的函数
const getPageContent = () => {
  // 尝试获取文章内容
  const article = document.querySelector('article');
  if (article) {
    return article.innerText.substring(0, 2000);
  }

  // 尝试获取主要内容
  const main = document.querySelector('main');
  if (main) {
    return main.innerText.substring(0, 2000);
  }

  // 尝试获取内容区域
  const contentSelectors = [
    '.content',
    '.post-content',
    '.article-content',
    '.entry-content',
    '#content',
    '.main-content',
  ];

  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.innerText.substring(0, 2000);
    }
  }

  // 获取页面所有文本（排除导航、侧边栏等）
  const bodyText = document.body.innerText;
  return bodyText.substring(0, 2000);
};

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'get_page_content') {
    const content = getPageContent();
    sendResponse({
      success: true,
      data: {
        title: document.title,
        url: window.location.href,
        content: content,
      },
    });
  }
  return true;
});

// 页面加载完成后添加保存按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(createSaveButton());
  });
} else {
  document.body.appendChild(createSaveButton());
}

void sampleFunction();
