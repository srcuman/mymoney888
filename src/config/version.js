/**
 * 统一版本配置文件
 * 所有涉及版本号的地方都应从此文件导入
 */
export const APP_VERSION = '4.0.0'
export const DB_VERSION = '4.0.0'
export const VERSION_INFO = {
  app: '4.0.0',
  database: '4.0.0',
  releaseDate: new Date().toISOString().split('T')[0],
  archVersion: 'v4.0.0 - 项目重命名为发发，架构优化'
}
export default APP_VERSION
