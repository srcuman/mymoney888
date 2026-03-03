// 注意：此文件为占位符，完整代码请参考项目文档
// 完整app.js文件约150KB，包含所有应用逻辑
// 请从本地项目目录dist/app.js复制完整内容

const { createApp, ref, computed, onMounted, nextTick } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// 版本控制
const APP_VERSION = '1.0.0';
const GITHUB_REPO = 'https://api.github.com/repos/srcuman/mymoney888/releases/latest';

// 检查版本更新
const checkForUpdates = async () => {
  try {
    const response = await fetch(GITHUB_REPO);
    if (response.ok) {
      const data = await response.json();
      const latestVersion = data.tag_name.replace('v', '');
      if (compareVersions(latestVersion, APP_VERSION) > 0) {
        return {
          hasUpdate: true,
          version: latestVersion,
          url: data.html_url
        };
      }
    }
  } catch (error) {
    console.log('版本检查失败:', error);
  }
  return { hasUpdate: false };
};

// 版本比较函数
const compareVersions = (v1, v2) => {
  const arr1 = v1.split('.');
  const arr2 = v2.split('.');
  for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
    const num1 = parseInt(arr1[i] || 0);
    const num2 = parseInt(arr2[i] || 0);
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

// 全局账套管理
const getCurrentBookId = () => localStorage.getItem('currentBookId') || 'default';
const getBookKey = (key) => `${key}_${getCurrentBookId()}`;

// 注意：完整代码包含所有页面组件、路由配置和应用逻辑
// 请从本地项目复制完整内容到此处
console.log('MyMoney888 v' + APP_VERSION + ' - 请上传完整app.js文件');
