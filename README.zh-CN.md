# Nano Banana UI

[English README](./README.md)

Nano Banana UI 是一个基于 `Vite 8 + React 19 + TypeScript` 的 Gemini 图片生成工作台，集成了参考图上传、生成历史管理、结果对比和生产环境运行时配置注入，适合作为可继续扩展的图像生成前后端一体化项目。

## 功能特性

- 基于官方 `@google/genai` SDK 调用 Gemini 图像生成能力
- 支持单次并发生成最多 4 张图像
- 最多支持上传 14 张参考图，并可复用生成结果作为下一轮参考图
- 支持生成历史、多选下载、对比查看和全屏预览，具备三栏紧凑且全面可折叠的界面设计
- 支持中文和英文界面切换，默认中文
- 支持在生产环境中通过 `/app-config.js` 向最终构建产物注入公开配置
- 前后端共享类型定义，减少接口漂移
- 内置 `ESLint`、`Stylelint`、`Prettier`、`TypeScript` 工程化配置

## 技术栈

- 前端：`React 19`、`Vite 8`、`TypeScript`、`Tailwind CSS v4`
- 后端：`Express 5`、`@google/genai`、`zod`
- 工程化：`ESLint`、`Stylelint`、`Prettier`、`tsx`、`TypeScript`

## 目录结构

```text
src/                  React 前端应用与 UI 组件
server/               Express API 与 Gemini 调用逻辑
shared/               前后端共享类型与运行时配置协议
dist/client/          前端构建产物
dist/server/          服务端构建产物
```

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 创建本地环境变量文件

```bash
cp .env.example .env
```

3. 填入你的 `GEMINI_API_KEY`

4. 启动开发环境

```bash
npm run dev
```

前端默认地址为 `http://localhost:5173`，API 默认地址为 `http://localhost:8787`。

## 运行时环境变量注入

现在这个项目已经支持生产环境运行时配置注入，不需要把公开配置硬编码进前端构建结果。

- 私密配置如 `GEMINI_API_KEY` 由服务端在运行时读取
- 前端公开配置通过 `GET /app-config.js` 输出到页面
- 构建后的客户端会在 React 挂载前读取 `window.__APP_CONFIG__`
- 这意味着你可以在不同环境里复用同一份前端构建产物，并通过运行时 env 调整公开配置

可公开注入的运行时变量：

- `PUBLIC_APP_NAME`
- `PUBLIC_API_BASE_URL`
- `PUBLIC_DEFAULT_LOCALE`

生产环境模板文件：

- [`./.env.production.example`](./.env.production.example)
- 本地忽略文件：`.env.production`

## 常用脚本

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

## 生产构建

1. 准备 `.env.production`
2. 执行构建

```bash
npm run build
```

3. 启动生产服务

```bash
npm run start
```

生产模式下，Express 会托管 `dist/client` 中的前端资源，并通过 `/app-config.js` 注入运行时配置。

## API 简介

`POST /api/generate-image`

请求体包含：

- `model`
- `prompt`
- `responseMode`
- `aspectRatio`
- `imageSize`
- `grounding`
- `referenceImages`

返回内容包含：

- 生成后的图片 data URL
- 模型与生成参数信息
- 原始 prompt 信息
- 生成时间戳

## License

在仓库正式发布前，请补充与你发布方式一致的许可证说明。
