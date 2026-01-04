# V-Link Music

一个用于播放 B 站视频音乐的程序，参考 YouTube Music 和 ボカコレ 设计，提供现代化的音乐播放体验。

## 项目简介

V-Link Music 是一个基于 Vue 3 开发的音乐播放应用，专注于提供沉浸式的音乐播放体验。

### 核心特性

- 🎵 **祭典榜单风格首页** - 横向滚动的推荐位和纵向的排行榜
- 🎧 **沉浸式播放体验** - 全屏播放界面，背景模糊效果
- 🎨 **现代化 UI** - 使用 Tailwind CSS 构建美观的渐变界面
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🎮 **播放控制** - 播放/暂停、上一首/下一首、音量控制、播放队列

## 技术栈

- Vue 3 (Composition API) + TypeScript
- Vite + Vue Router 4
- Pinia (状态管理)
- Tailwind CSS 4

## 快速开始

### 环境要求

- Node.js: ^20.19.0 || >=22.12.0
- pnpm (推荐) 或 npm

### 安装与运行

```sh
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

### 其他命令

```sh
pnpm type-check  # 类型检查
pnpm test:unit   # 运行测试
pnpm lint        # 代码检查
pnpm format      # 代码格式化
```

## 主要功能

- **首页**: 展示精选推荐和多个排行榜（日榜、周榜、月榜）
- **播放器**: 沉浸式播放界面，支持播放控制、播放模式切换、音量调节和播放队列管理

## 未来计划

- [ ] 集成 B 站 API，实现真实的视频音乐播放
- [ ] 添加搜索功能
- [ ] 实现用户收藏和播放列表
- [ ] 添加歌词显示
- [ ] 支持音频可视化
- [ ] 使用 Electron 打包桌面应用

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
