# 智融反诈 · 多模态防诈助手

基于大模型的反诈骗检测系统，支持 **Web 端**、**uni-app 小程序** 与 **桌面微信自动化** 演示。可对文本、图片、音频、视频进行风险分析，并联动预警中心、安全报告与监护人通知。

## 功能概览

- 多模态 AI 检测：文本 / 图片 / 音频 / 视频
- 智能问答：反诈知识咨询
- 风险工作流：中/高风险事件记录与通知
- 反诈知识库、安全报告、预警中心
- 监护人端与用户端分角色界面
- **微信演示（wxauto）**：他人发来可疑消息 → AI 分析 → 桌面弹窗 + 向指定会话发送反诈提醒

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Node.js、Express、OpenAI SDK（兼容千问等）、ffmpeg |
| Web 前端 | Vue 3、Vuetify 3、Vite |
| 小程序 | uni-app |
| 微信自动化 | Python、wxauto（仅 Windows + 桌面微信） |

## 环境要求

- **Node.js** 18+
- **npm**
- （可选）MySQL，见 `backend/.env` 中 `STORAGE_DRIVER`
- 微信演示需：**Windows**、已登录的**桌面微信**、独立 Python 环境（见下文）
- 调用云端大模型时需保证网络可达（如千问 DashScope）

## 快速开始

### 1. 配置后端密钥

```bash
cd backend
copy .env.example .env
# 编辑 .env，填入 QWEN_API_KEY、DEEPSEEK_API_KEY 等
npm install
```

> ⚠️ **切勿将 `.env` 提交到 Git。** 仓库仅包含 `.env.example` 占位模板。

### 2. 启动 Web 服务（推荐）

在项目根目录双击或在终端执行：

```bat
run-all-model.bat
```

- 前端：<http://127.0.0.1:8008>
- 后端：<http://127.0.0.1:7007>
- 健康检查：<http://127.0.0.1:7007/api/health>

其他脚本：

| 脚本 | 说明 |
|------|------|
| `run-model.bat` | 仅启动后端 |
| `stop.bat` | 停止前后端占用端口 |
| `mark.bat` | 检查并安装依赖 |

### 3. 微信自动化演示（可选）

1. 安装 [wxauto](https://github.com/cluic/wxauto) 的 Python 虚拟环境（示例路径：`%USERPROFILE%\Documents\wxbot\.venv`）
2. 修改 `run-wechat-demo.bat` 中的 `WX_PY` 为你的 `python.exe` 路径
3. 先启动后端 `run-model.bat`，再运行 `run-wechat-demo.bat`
4. 用**另一个微信号**向本机账号发送可疑文案，触发后将向 **墨墨**（可在脚本中修改）发送反诈提醒
5. 停止监听：双击 `stop-wechat-auto.bat`

```bat
# 命令行等价示例
python scripts/wechat_alert_demo.py demo --seconds 300 --alert-to 墨墨
python scripts/wechat_alert_demo.py probe
```

## 项目结构

```text
├── backend/           # API 服务（主入口 start-model.js）
├── frontend/          # Web 管理端
├── fanzhavue、/        # uni-app 小程序源码
├── scripts/           # 微信桥接 Python 脚本
├── data/              # JSON 数据（知识库、报告、风险事件等）
├── docs/              # 技术文档与答辩材料
├── run-all-model.bat  # 一键启动
└── run-wechat-demo.bat
```

更详细的接口与架构说明见 [`docs/技术文档.md`](docs/技术文档.md)。

## 演示流程（微信）

```text
他人微信发可疑消息 → wxauto 抓取 → POST /api/analyze/text
    → 达到风险阈值 → 桌面弹窗 + 向「墨墨」发送反诈提醒文案
```

## 常见问题

**路径含括号导致 bat 闪退？**  
启动脚本已使用 `pushd` + 相对路径规避，请从项目根目录运行 bat。

**AI 调用超时？**  
检查 VPN/网络，确认 `backend/.env` 中 Key 有效，后端已启动。

**push 很慢或被拒绝？**  
仓库已忽略大体积视频（`data/video/`），请勿将超过 100MB 的文件加入 Git。

## 许可证

本项目用于课程/竞赛演示与学习交流。使用第三方 API 时请遵守对应服务商条款。

## 仓库

- GitHub: <https://github.com/zx67834/-.git>
- 默认分支：`main`
