# Flask Aider

Flask Aider 是一个基于 Flask 的 Web 界面，用于替代 [aider](https://github.com/AI4Wings/aider) 的终端交互方式。它提供了一个直观的用户界面，使用户能够更轻松地与 AI 辅助编程工具进行交互。

**注意**：原始的 aider 工具是一个命令行应用程序，而 Flask Aider 提供了一个 Web 界面，使其更易于使用，特别是对于不熟悉命令行的用户。

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
- **模型配置管理**：通过 Web 界面直观管理模型配置参数

## 架构设计

Flask Aider 采用了以下架构设计：

1. **前端**：使用 HTML、CSS 和 JavaScript 构建用户界面，通过 AJAX 和 WebSocket 与后端通信。
2. **后端**：使用 Flask 提供 RESTful API，处理用户请求并与 aider 核心组件交互。
3. **WebSocket**：使用 Flask-SocketIO 实现实时通信，显示 AI 处理过程中的输出。
4. **会话管理**：使用内存存储管理用户会话和聊天历史。

## 详细部署流程

### 系统要求

- Python 3.9+ 
- Git
- 支持的操作系统：Linux、macOS 或 Windows
- 至少 2GB 可用内存
- 网络连接（用于与 AI 模型 API 通信）

### 安装步骤

#### 1. 克隆 aider 仓库

```bash
git clone https://github.com/AI4Wings/aider.git
cd aider
git checkout flask-web-interface
```

#### 2. 创建虚拟环境

```bash
# 使用 Python 虚拟环境
python -m venv venv

# 在 Linux/macOS 上激活虚拟环境
source venv/bin/activate

# 在 Windows 上激活虚拟环境
# venv\Scripts\activate
```

#### 3. 安装 aider 及其依赖

```bash
# 安装 aider 及其依赖
python -m pip install aider-install
pip install -r requirements.txt
pip install -e .

# 安装 Flask 和 Flask-SocketIO
pip install flask flask-socketio eventlet
```

#### 4. 配置环境变量

根据您使用的 AI 模型，设置相应的 API 密钥：

```bash
# 对于 OpenAI 模型（如 GPT-4o）
export OPENAI_API_KEY=your_openai_api_key

# 对于 Anthropic 模型（如 Claude）
export ANTHROPIC_API_KEY=your_anthropic_api_key

# 在 Windows 上使用 set 命令
# set OPENAI_API_KEY=your_openai_api_key
```

您也可以将这些环境变量添加到 `.env` 文件中：

```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

#### 5. 启动应用

```bash
cd flask_interface
python app.py
```

应用将在 http://localhost:5000 上运行。您可以使用浏览器访问此地址来使用 Flask Aider。

#### 6. 使用 Docker 部署（可选）

如果您希望使用 Docker 部署，可以按照以下步骤操作：

1. 创建 Dockerfile：

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY . /app/
RUN python -m pip install aider-install
RUN pip install -r requirements.txt
RUN pip install -e .
RUN pip install flask flask-socketio eventlet

EXPOSE 5000

CMD ["python", "flask_interface/app.py"]
```

2. 构建和运行 Docker 容器：

```bash
# 构建 Docker 镜像
docker build -t aider -f docker/Dockerfile .

# 运行 Docker 容器
docker run -p 5000:5000 -e OPENAI_API_KEY=your_openai_api_key aider
```

#### 7. 配置反向代理（用于生产环境）

对于生产环境，建议使用 Nginx 或 Apache 作为反向代理：

**使用 Nginx**：

```
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://localhost:5000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 故障排除

#### 常见问题

1. **无法连接到 AI 模型 API**
   - 检查 API 密钥是否正确设置
   - 确认网络连接正常
   - 检查 API 服务是否可用

2. **应用启动失败**
   - 确保所有依赖都已正确安装
   - 检查端口 5000 是否被其他应用占用
   - 查看日志以获取详细错误信息

3. **WebSocket 连接问题**
   - 确保使用了兼容的浏览器（Chrome、Firefox、Safari 等）
   - 检查防火墙设置是否阻止了 WebSocket 连接
   - 如果使用反向代理，确保正确配置了 WebSocket 代理设置

#### 日志位置

- 应用日志直接输出到控制台
- 如果使用 systemd 管理服务，可以使用 `journalctl` 查看日志

## 使用指南

### 1. 创建新会话

1. 打开应用后，点击右上角的 "New Session" 按钮
2. 在设置对话框中选择 AI 模型并输入 API 密钥（如果尚未通过环境变量设置）
3. 点击 "Save changes" 保存设置

### 2. 加载仓库

1. 在左侧边栏的 "Repository" 部分，输入本地 Git 仓库的路径
2. 点击 "Load" 按钮加载仓库

### 3. 添加文件到聊天

1. 加载仓库后，点击 "Add to Chat" 按钮
2. 在弹出的对话框中选择要添加到聊天的文件
3. 点击 "Add Selected Files" 确认添加

### 4. 与 AI 交互

1. 在底部的文本框中输入消息
2. 点击 "Send" 按钮或按 Enter 键发送消息
3. AI 的响应将显示在聊天区域

### 5. 提交更改

1. 在左侧边栏的 "Git Operations" 部分，输入提交消息
2. 点击 "Commit" 按钮提交更改

### 6. 配置模型设置

1. 点击右上角的 "Settings" 按钮
2. 在基本设置选项卡中，选择 AI 模型、编辑格式等基本设置
3. 在高级设置选项卡中，配置更详细的模型参数
4. 点击 "Save changes" 保存设置

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
