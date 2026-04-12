/**
 * 统一版本配置文件
 * 所有涉及版本号的地方都应从此文件导入
 */
export const APP_VERSION = '3.9.0'
export const DB_VERSION = '3.9.0'
export const VERSION_INFO = {
  app: '3.9.0',
  database: '3.9.0',
  releaseDate: new Date().toISOString().split('T')[0],
  archVersion: 'v3.9.0 - 数据为核心，标签化存储架构'
}
export default APP_VERSION
