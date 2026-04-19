# 分支功能说明

## 版本：v4.0.0

## 分支策略

```
main          → 稳定版本（生产环境）
test          → 测试版本（验证新功能）
dev           → 开发版本（日常开发）
```

## 各分支用途

### main 分支
- **用途**：生产环境稳定版本
- **保护**：需要 Pull Request 合并
- **部署**：自动部署到生产服务器
- **更新频率**：每 1-2 个月发布一个稳定版本

### test 分支
- **用途**：测试新功能和修复
- **保护**：需要代码审查
- **部署**：测试环境
- **更新频率**：每周更新
- **测试内容**：
  - 新功能测试
  - Bug 修复验证
  - 数据迁移测试
  - 多设备同步测试

### dev 分支
- **用途**：日常开发
- **保护**：无
- **部署**：本地开发
- **更新频率**：每天多次提交

## 工作流程

```
1. 从 dev 创建功能分支
   git checkout -b feature/xxx dev

2. 开发完成后合并到 dev
   git checkout dev
   git merge feature/xxx

3. dev 稳定后合并到 test
   git checkout test
   git merge dev

4. test 验证通过后合并到 main
   git checkout main
   git merge test
```

## 分支命名规范

| 类型 | 示例 | 说明 |
|------|------|------|
| 功能分支 | feature/investment-cycle | 新功能开发 |
| 修复分支 | fix/balance-calculation | Bug 修复 |
| 重构分支 | refactor/data-store | 代码重构 |
| 文档分支 | docs/api-reference | 文档更新 |

## 版本号规则

采用语义化版本 `主版本.次版本.修订号`：

- **主版本 (3.8.0)**：重大架构变更，不兼容的 API 变更
- **次版本 (3.8.0)**：新功能添加，向后兼容
- **修订号 (3.8.1)**：Bug 修复，向后兼容

## 发布流程

1. **准备发布**
   ```bash
   git checkout test
   npm version 3.8.0
   git push origin test --tags
   ```

2. **测试验证**
   - 功能测试
   - 数据迁移测试
   - 性能测试

3. **合并到 main**
   ```bash
   git checkout main
   git merge test
   git tag v3.8.0
   git push origin main --tags
   ```

4. **发布后处理**
   - 更新 CHANGELOG.md
   - 更新文档
   - 通知用户

## 回滚流程

### 代码回滚
```bash
# 回滚到上一个版本
git revert HEAD

# 回滚到指定版本
git revert <commit-hash>
```

### 数据回滚
- 从 MySQL 恢复
- 从 JSON 备份恢复
- 参考 DATA_STORAGE_ARCHITECTURE.md

## 常见问题

### Q: 如何在 test 分支测试新功能？
A:
```bash
git checkout test
git pull origin test
# 测试新功能
```

### Q: 如何在本地测试多设备同步？
A:
1. 启动后端服务
2. 在多个浏览器/设备登录同一账号
3. 在一个设备操作，观察其他设备更新

### Q: 数据冲突如何处理？
A:
- 当前策略：本地优先
- 未来计划：最后一次写入胜出
- 参考 DATA_STORAGE_ARCHITECTURE.md

## 相关文档

- [README.md](../README.md) - 项目概述
- [DATA_STORAGE_ARCHITECTURE.md](../docs/DATA_STORAGE_ARCHITECTURE.md) - 数据存储架构
- [DATABASE_DESIGN.md](../DATABASE_DESIGN.md) - 数据库设计
- [DEPLOY.md](../DEPLOY.md) - 部署指南
