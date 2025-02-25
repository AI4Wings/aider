# Flask Aider

Flask Aider 是一个基于 Flask 的 Web 界面，用于替代 [aider](https://github.com/AI4Wings/aider) 的终端交互方式。它提供了一个直观的用户界面，使用户能够更轻松地与 AI 辅助编程工具进行交互。

## 技术选择

本项目选择 Flask 作为 Web 框架的原因：

1. **轻量级和灵活性**：Flask 是一个轻量级框架，非常适合构建简单到中等复杂度的 API 和 Web 应用程序。
2. **易于集成**：Flask 可以轻松集成现有的 Python 代码库（如 aider），无需大量修改。
3. **WebSocket 支持**：通过 Flask-SocketIO 扩展，可以实现实时通信功能，这对于显示 AI 处理过程中的实时输出非常重要。
4. **简单直观**：Flask 的路由系统和模板引擎简单直观，便于快速开发和理解。

## 功能特点

- **会话管理**：支持创建和管理多个 aider 会话
- **仓库集成**：加载和管理 Git 仓库
- **文件管理**：浏览、选择和添加文件到聊天
- **实时通信**：通过 WebSocket 实时显示 AI 处理过程
- **模型选择**：支持选择不同的 AI 模型（如 GPT-4o、Claude 3.5 Sonnet 等）

## 架构设计

Flask Aider 采用了以下架构设计：

1. **前端**：使用 HTML、CSS 和 JavaScript 构建用户界面，通过 AJAX 和 WebSocket 与后端通信。
2. **后端**：使用 Flask 提供 RESTful API，处理用户请求并与 aider 核心组件交互。
3. **WebSocket**：使用 Flask-SocketIO 实现实时通信，显示 AI 处理过程中的输出。
4. **会话管理**：使用内存存储管理用户会话和聊天历史。

## 安装和使用

### 前提条件

- Python 3.9+
- aider 库

### 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/yourusername/flask-aider.git
   cd flask-aider
   ```

2. 创建虚拟环境：
   ```bash
   python -m venv venv
   source venv/bin/activate  # 在 Windows 上使用 venv\Scripts\activate
   ```

3. 安装依赖：
   ```bash
   pip install flask flask-socketio
   pip install -e /path/to/aider  # 安装 aider 库
   ```

### 运行应用

```bash
python app.py
```

应用将在 http://localhost:5000 上运行。

## 数据存储

Flask Aider 使用内存存储来管理用户会话和聊天历史。这意味着当应用重启时，所有数据都将丢失。这种方法适用于概念验证和开发阶段，但在生产环境中可能需要考虑使用持久化存储解决方案。

## 与 aider 的集成

Flask Aider 通过以下方式与 aider 核心组件集成：

1. **模型交互**：使用 aider 的 `Model` 类处理与 AI 模型的交互。
2. **代码编辑**：使用 aider 的 `Coder` 类（如 `EditBlockCoder`）处理代码编辑和修改。
3. **仓库管理**：使用 aider 的 `GitRepo` 类处理 Git 仓库操作。
4. **命令处理**：使用 aider 的 `Commands` 类处理用户命令。
5. **输入/输出**：通过自定义的 `WebIO` 类（继承自 aider 的 `InputOutput`）将终端输出重定向到 Web 界面。

## 未来改进

- 添加用户认证和授权
- 实现持久化存储
- 支持多用户协作
- 添加更多的 UI 功能，如代码高亮和差异显示
- 优化性能和响应时间
