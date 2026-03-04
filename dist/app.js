const { createApp, ref, computed, onMounted, nextTick } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// 版本控制
const APP_VERSION = '1.2.0';
const GITHUB_REPO = 'https://api.github.com/repos/srcuman/mymoney888/releases/latest';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/srcuman/mymoney888/main';