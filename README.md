This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## 部署

### 构建

```bash
npm run build
```

### 服务管理（launchd）

使用 macOS LaunchAgent 运行，切换用户不会中断服务，崩溃自动重启。

配置文件：`~/Library/LaunchAgents/com.openclaw.bestme.plist`

```bash
# 启动服务
launchctl load ~/Library/LaunchAgents/com.openclaw.bestme.plist

# 停止服务
launchctl unload ~/Library/LaunchAgents/com.openclaw.bestme.plist

# 重启（先停再启）
launchctl unload ~/Library/LaunchAgents/com.openclaw.bestme.plist
launchctl load ~/Library/LaunchAgents/com.openclaw.bestme.plist

# 查看状态
launchctl list | grep bestme

# 查看是否在运行
lsof -i :2017
```

### 日志

- 标准输出：`bestme.log`
- 错误输出：`bestme-error.log`

### 访问

iPad 访问 http://192.168.3.95:2017

### 注意

升级 Node.js 版本后需更新 plist 中的 node 路径。