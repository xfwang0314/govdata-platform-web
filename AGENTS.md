# GovData Platform Web - Agent Guide

本文件是前端工程 `govdata-platform-web` 内 Agent 和开发人员的强制规则入口。

## 架构说明
本项目是基于 **Vben Admin** 架构的 Monorepo 工程（Vue3 + Vite + Tailwind CSS + Ant Design Vue），主应用位于 `apps/web-antd`，核心包位于 `packages` 下。

## 强制开发规范（以 govdata 为例）

### 1. 物理目录约定
- **页面视图**：对于普通的业务页面（如后台 CRUD），统一存放在主应用的 `views` 目录下。例如：`apps/web-antd/src/views/govdata/datasource`。**不建议**为了简单的业务页面去 `packages/business/` 下创建新的独立子包，避免过度设计。
- **接口定义**：遵循现有的按领域集中的规范。例如：`apps/web-antd/src/api/govdata/datasource`。**严禁**将 API 接口请求散落在 Vue 组件内或者直接写在 `views` 目录下，所有接口必须通过统一管理的 API 文件引入。

### 2. UI 组件规范
- **表格与表单**：后台 CRUD 列表和数据录入界面，必须优先使用 Vben 深度封装的组件（`vben-vxe-table` 和 `vben-form`）。基于 Schema 驱动能保证全站样式高度统一，同时拥有最优的渲染性能。避免过多手写原生 `a-table` 或 `a-form`，除非遇到极个别特殊的交互场景。

### 3. 状态管理规范 (Pinia)
- **尽量局部化**：对于常规页面的列表数据、当前页表单输入项，应完全交由组件内部的 `ref` 或 `reactive` 管理。
- **跨组件/全局状态**：只有真正跨越多个大组件、甚至多页面强依赖共享的数据（如：全局的数据字典树、当前已激活的数据源长连接状态等），才允许放入全局 Store 中。
- **目录位置**：`apps/web-antd/src/store/govdata/datasource`。

## Git 工作流规范
同后端一致，遵循 Conventional Commits：
- 开发新页面或组件，分支名使用 `feature/xxx`。
- 提交前缀严格使用 `feat`、`fix`、`chore` 等语义化前缀，后接中文描述。
