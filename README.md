# 政务数据中台前端

面向政务数据资源汇聚、治理、共享和服务的一体化前端工程。

## 技术栈

- Vue 3 + TypeScript + Vite
- Ant Design Vue
- Pinia + Vue Router
- pnpm workspace + Turbo

## 本地开发

项目要求 Node.js 22.18+ 和 pnpm 11+。

```bash
pnpm install
pnpm dev:antd
```

前端应用位于 `apps/web-antd`，日常业务开发主要涉及：

```text
apps/web-antd/src/views   页面
apps/web-antd/src/api     接口
apps/web-antd/src/router  路由
apps/web-antd/src/store   业务状态
```

## 构建

```bash
pnpm build:antd
```

## 业务规划

- 数据资源目录
- 数据汇聚与交换
- 数据标准与质量
- 数据资产管理
- 数据服务与 API
- 数据安全与审计
