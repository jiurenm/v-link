# V-Link

一个沉浸式的 Project Sekai (PJSK) 与 Vocaloid 音乐播放器，支持多版本 MV 切换与 Bilibili DASH 流式播放。

## ✨ 特性

- 🎬 **多版本 MV 播放** — 2D MV / 3D MV / 纯音频一键切换
- 🎵 **DASH 流媒体** — 基于 Bilibili DASH 协议的高品质流式播放
- 🎨 **沉浸式界面** — 封面色彩自动提取、玻璃态 UI、动态背景
- 📱 **移动端适配** — 响应式布局 + PWA 支持，手机浏览器可安装到主屏
- 🖥️ **桌面应用** — Electron 打包，支持 Windows / macOS / Linux
- 🔍 **探索与筛选** — 按团体、版本类型、播放量等多维度浏览歌曲
- 📊 **数据集成** — VocaDB 元数据、P主/画师信息卡

## 🛠️ 技术栈

- **框架**：Vue 3 + Pinia + Vue Router
- **核心**：Bilibili DASH 流媒体播放（dash.js）
- **样式**：Tailwind CSS 4 + 封面色彩自动提取
- **桌面应用**：Electron + electron-vite
- **移动端**：PWA Manifest + 响应式设计 + Safe Area 适配

## 🚀 快速开始

### Web 开发

```sh
pnpm install
pnpm dev
```

访问 `http://localhost:5173/`，可使用 Chrome DevTools 模拟移动设备。

### 桌面应用开发

```sh
pnpm dev:electron
```

### 构建桌面应用

```sh
pnpm build:electron
```

## 📱 移动端使用

V-Link 支持作为 PWA 在移动端使用：

1. 在手机浏览器中访问部署后的 Web 地址
2. 点击浏览器菜单中的 **"添加到主屏幕"**
3. 像原生 App 一样使用

移动端特性：
- 底部导航栏（首页 / 探索 / 播放列表）
- 上滑进入播放页，下滑返回
- iPhone 安全区域适配

## 📝 许可证

MIT License

