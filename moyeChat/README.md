
## 目录结构

apps/
  web/       Next.js Web 应用
  mobile/    Expo Mobile 应用
packages/
  chat-core/   聊天核心逻辑
  chat-sdk/    前端请求与流式事件适配层
  ui-web/      Web UI 组件
  ui-mobile/   Mobile UI 组件
  types/       跨包共享类型
  utils/       跨包共享工具
```

## 安装依赖
先全局安装 Rush：

```bash
npm install -g @microsoft/rush
```

安装所有项目依赖：

```bash
rush update --full
```

日常安装已锁定依赖时也可以使用：

```bash
rush install
```

## 构建与校验

`rush build` 会按 Rush 依赖图执行各项目的 `build` 脚本。

在本项目里，它会先构建 `packages/*`，输出各包的 `dist` 产物；再构建依赖这些包的应用，例如 `apps/web`。

```bash
rush build
```

只构建 Web 以及 Web 依赖的所有包，包括执行 `apps/web` 的 `next build`：

```bash
rush build --to @agent-chat/web
```

只构建 Web 的依赖包，不构建 Web 应用本身：

```bash
rush build --to-except @agent-chat/web
```

只构建某个包及其依赖：

```bash
rush build --to @agent-chat/chat-core
```

类型检查：

```bash
rush typecheck
```

代码检查：

```bash
rush lint
```

## 启动项目

Web：

```bash
cd apps/web
rushx dev
```

如果你只想先构建 Web 依赖的内部包，然后启动 Web dev，不想执行 `next build`：

```bash
rush build --to-except @agent-chat/web
cd apps/web
rushx dev
```

Mobile：

```bash
cd apps/mobile
rushx start
```

`rushx` 会在当前项目目录执行该项目 `package.json` 中的脚本，相当于在 Rush 管理环境下运行项目脚本。

## 添加依赖

进入目标项目目录后执行：

```bash
rush add -p package-name
```

添加开发依赖：

```bash
rush add -p package-name --dev
```

## 环境配置

Web 端读取：

```bash
NEXT_PUBLIC_CHAT_STREAM_URL=
```

Mobile 端读取 Expo 配置：

```json
{
  "expo": {
    "extra": {
      "chatStreamUrl": ""
    }
  }
}
