# 贡献指南

感谢您对 OCR & CAPTCHA MCP Server 项目的关注！我们欢迎所有形式的贡献。

## 🚀 快速开始

1. **Fork 仓库**
   ```bash
   # 点击 GitHub 页面右上角的 Fork 按钮
   ```

2. **克隆你的 Fork**
   ```bash
   git clone https://github.com/your-username/ocr-captcha-mcp-server.git
   cd ocr-captcha-mcp-server
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ 开发环境设置

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 本地开发
```bash
# 开发模式运行
npm run dev

# 构建项目
npm run build

# 运行测试
npm test

# 代码检查
npm run lint
```

### Docker 开发
```bash
# 构建 Docker 镜像
docker build -t ocr-captcha-mcp .

# 运行容器
docker run -p 8080:8080 ocr-captcha-mcp
```

## 📝 代码规范

### TypeScript 风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 配置规则
- 所有公共 API 必须有类型注解
- 优先使用接口而非类型别名

### 命名约定
- 变量和函数：`camelCase`
- 类名：`PascalCase`
- 常量：`UPPER_SNAKE_CASE`
- 文件名：`kebab-case.ts`

### 注释规范
```typescript
/**
 * 功能描述
 * @param param1 参数1描述
 * @param param2 参数2描述
 * @returns 返回值描述
 */
function exampleFunction(param1: string, param2: number): boolean {
  // 实现逻辑
  return true;
}
```

## 🧪 测试

### 测试类型
- **单元测试**: `tests/*.test.ts`
- **集成测试**: `test-*.cjs` 和 `test-*.ts`
- **协议测试**: `test-protocol.cjs`

### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --testNamePattern="OCR"

# 生成覆盖率报告
npm test -- --coverage
```

### 测试要求
- 新功能必须包含测试用例
- 测试覆盖率应保持在 80% 以上
- 所有测试必须通过 CI 检查

## 📋 提交指南

### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型说明
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例
```
feat(ocr): 添加多语言支持

- 支持中文、英文混合识别
- 优化识别准确率
- 添加语言自动检测

Closes #123
```

## 🔄 Pull Request 流程

1. **确保代码质量**
   - 运行 `npm run lint` 检查代码规范
   - 运行 `npm test` 确保所有测试通过
   - 运行 `npm run build` 确保构建成功

2. **推送到你的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 填写详细的描述信息
   - 链接相关的 Issue

4. **代码审查**
   - 等待维护者审查
   - 根据反馈进行修改
   - 保持讨论的友好和建设性

## 🐛 错误报告

### 报告 Bug
使用 [GitHub Issues](https://github.com/ymeng98/ocr-captcha-mcp-server/issues) 报告错误：

1. 搜索现有 Issues 确认问题未被报告
2. 使用 Bug Report 模板
3. 提供详细的重现步骤
4. 包含环境信息（Node.js 版本、操作系统等）
5. 附上错误日志和截图

### 功能请求
1. 使用 Feature Request 模板
2. 详细描述所需功能
3. 说明使用场景和预期收益
4. 考虑实现的复杂性

## 📚 文档贡献

### 文档类型
- API 文档
- 使用指南
- 部署文档
- 故障排除

### 文档规范
- 使用清晰的标题结构
- 提供代码示例
- 包含截图或图表（如需要）
- 保持内容简洁明了

## 🤝 社区准则

### 行为准则
- 尊重所有贡献者
- 保持友好和专业的态度
- 欢迎新手提问和学习
- 避免人身攻击和不当言论

### 沟通渠道
- GitHub Issues: 错误报告和功能请求
- GitHub Discussions: 技术讨论和问答
- Pull Request: 代码审查和改进建议

## 🏆 认可贡献者

我们感谢所有贡献者的努力！贡献者将在以下方式获得认可：

- 在 README 中列出
- 在 Release Notes 中提及
- 获得 Contributor 徽章

## 📞 联系我们

如有任何问题或建议，请通过以下方式联系：

- 创建 GitHub Issue
- 发起 GitHub Discussion
- 在 Pull Request 中评论

再次感谢您的贡献！🙏
