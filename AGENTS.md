# GovData Platform Web - Agent Guide

本文件是前端工程 `govdata-platform-web` 内 Agent 和开发人员的强制规则入口。详细规范以 `.docs/standards/frontend-coding.md` 为事实来源，`.agents/` 只保存执行清单和模板。

## 开发前必读

- 先阅读 `.docs/standards/frontend-coding.md` 和目标模块现有实现；新增功能执行 `.agents/checklists/frontend-feature.md`。
- 本项目基于 Vben Admin 5（Vue 3、Vite、Tailwind CSS、Ant Design Vue），主应用位于 `apps/web-antd`，公共能力位于 `packages`。

## 强制开发规范与边界

### 1. 目录与命名

- 业务页面放在 `apps/web-antd/src/views/<domain>/<module>/`，入口使用 `index.vue`；表格、查询表单 Schema 优先放在 `data.ts` 或 `data.tsx`。
- 模块组件较多时使用 `components/` 子目录；小型页面可以与入口同级。新增文件在同一模块内保持一种命名风格，不为统一大小写机械移动既有文件。
- API 收口在 `apps/web-antd/src/api/<domain>/<module>/`，组件禁止直接调用底层 HTTP 客户端。

### 2. UI 与样式

- 优先使用 Vben 封装的表格、表单、Modal 和 Drawer，复杂业务交互可使用 `antdv-next` 标准组件。
- 已在 `components/global` 注册的组件允许使用全局标签；其他组件从 `antdv-next` 显式导入。
- 页面布局优先使用 Tailwind CSS；复杂、复用困难的状态样式可以使用 `<style scoped>`。禁止无依据的内联硬编码样式和全局样式污染。

### 3. Modal、Drawer 与状态

- 编辑或详情组件需要行快照时，在 `.open()` 前使用 `setData`；新建、静态确认等无行数据场景不强制。
- 异步初始化使用 `loading(true)` 和 `try/finally` 释放 Loading；不得仅为满足文本规则提前调用 `loading(false)`。
- 普通页面状态保持在组件内；只有跨页面共享且有稳定生命周期的数据才进入 Pinia。
- 权限指令用于受控业务操作；无权限语义的关闭、取消、展开等按钮不强制绑定权限码。

## Git 工作流规范

同后端一致，遵循 Conventional Commits：

- 开发新页面或组件，分支名使用 `feature/xxx`。
- 提交信息使用 `type(scope): 中文描述`；主应用页面和 API 的 scope 固定使用 `@govdata/web-antd`，例如 `feat(@govdata/web-antd): 完成凭据管理页面`，不得自定义 `secret` 等 scope。
- 提交前必须执行 `.agents/checklists/frontend-feature.md`；Oxlint、Oxfmt、ESLint、Stylelint、CheckType 和 Commitlint 任一失败均不得提交，禁止使用 `--no-verify` 绕过。
- 测试代码与生产代码遵循相同静态检查规则并随功能提交；禁止使用非空断言逃避类型收窄。
