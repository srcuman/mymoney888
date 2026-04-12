// 升级服务
// 用于检查更新和执行升级操作

import axios from 'axios'

const upgradeService = {
  // 检查是否有新版本
  checkForUpdates: async () => {
    try {
      // 使用统一版本配置
      const currentVersion = APP_VERSION
      
      // 尝试从Gitee仓库获取最新版本信息
      const repoUrl = 'https://gitee.com/srcuman/mymoney888/raw/test/package.json'
      const response = await axios.get(repoUrl)
      
      if (response.status === 200) {
        const latestVersion = response.data.version
        return {
          currentVersion,
          latestVersion,
          hasUpdate: currentVersion !== latestVersion
        }
      }
      
      return {
        currentVersion,
        latestVersion: currentVersion,
        hasUpdate: false
      }
    } catch (error) {
      console.error('检查更新失败:', error)
      return {
        currentVersion: '0.0.0',
        latestVersion: '0.0.0',
        hasUpdate: false,
        error: error.message
      }
    }
  },
  
  // 执行升级
  performUpgrade: async () => {
    try {
      // 执行升级脚本
      const response = await axios.post('/api/upgrade')
      return response.data
    } catch (error) {
      console.error('执行升级失败:', error)
      return {
        success: false,
        message: error.message
      }
    }
  },
  
  // 检查升级状态
  checkUpgradeStatus: async () => {
    try {
      const response = await axios.get('/api/upgrade/status')
      return response.data
    } catch (error) {
      console.error('检查升级状态失败:', error)
      return {
        status: 'error',
        message: error.message
      }
    }
  }
}

export default upgradeService
