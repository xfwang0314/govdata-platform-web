# GovData Platform Web - 前端开发规范与设计指南

本文件是 `govdata-platform-web` 前端工程的开发规范与设计标准。全站代码开发、重构与 Code Review 必须严格遵循本规范。

---

## 1. 目录结构与组件命名规范

### 1.1 物理目录约定

- **业务视图页面**：统一存放在 `apps/web-antd/src/views/<domain>/<module>/` 下（例如 `apps/web-antd/src/views/platform/secret/`）。
- **模块专属组件目录**：模块组件较多时放入 `components/` 子目录；只有少量组件时可以与入口同级。不得仅为统一目录而机械移动稳定的既有组件。
- **API 接口收口**：统一存放在 `apps/web-antd/src/api/<domain>/<module>/` 下（包含 `index.ts` 与 `model.d.ts`）。严禁在 Vue 组件内直接调用底层裸 HTTP 请求。

### 1.2 文件与组件命名规则

- **主入口页面**：固定为 `index.vue`。
- **表格/表单配置**：固定为 `data.tsx`（或 `data.ts`）。
- **子组件 / 弹窗 / 抽屉文件名**：新增文件在模块内保持一致，推荐采用 kebab-case 并包含功能后缀：
  - 新建弹窗：`components/secret-create-modal.vue`
  - 编辑弹窗：`components/secret-edit-modal.vue`
  - 轮换/操作弹窗：`components/secret-rotate-modal.vue`
  - 详情抽屉：`components/secret-detail-drawer.vue`
  - 局部子编辑器：`components/secret-values-editor.vue`
  - 数据源弹窗：`components/datasource-modal.vue`

---

## 2. UI 组件库与 CSS 样式编写规范

数据中台业务页面同时遵循 [控制台设计基线](govdata-console-design.md)。新增资源管理页和目录工作区优先复用其中的 Design Token、项目标准 `useVbenVxeGrid` / `BasicTable`、`gov-metadata-workbench` 与 `ConsoleStatus`，不得为单个页面另建一套颜色、圆角、阴影和间距体系。

新建和编辑表单必须遵循控制台设计基线中的“新建与编辑表单统一规格”，复用 `components/govdata/console-form.ts`，不得自行配置另一套标签宽度、分组及按钮位置。

### 2.1 UI 组件库导入 (`antdv-next`)

- `components/global` 已注册的组件允许使用全局标签；其他 Ant Design Vue 组件从 `antdv-next` 显式按需导入。
- 禁止使用未注册或行为不明确的标签。复杂数据描述优先使用 `antdv-next` 标准 Schema 或 `items`。

### 2.2 Tailwind CSS 样式规范

- 页面与组件排版优先采用 Tailwind CSS 原子类。
- 复杂状态、伪元素或第三方组件覆盖可使用 `<style scoped>`；禁止污染全局样式。
- 禁止无依据的 `style="..."` 硬编码；确需运行时动态计算时应说明原因。

---

## 3. API 接口与数据模型规范

### 3.1 接口收口与强类型

- 接口方法定义在 `api/<domain>/<module>/index.ts`。
- 类型定义在 `api/<domain>/<module>/model.d.ts`，Command、Query、View 必须保持强类型，Alova/Axios 请求必须携带范型。

### 3.2 Schema 驱动表格与表单 (`data.tsx`)

- 后台 CRUD 列表与搜索条件必须优先使用 Vben 深度封装的组件（`useVbenVxeGrid` 和 `useVbenForm`）。
- 列表列配置 `columns` 与搜索表单 `querySchema` 统一在 `data.tsx` 中定义与导出。

### 3.3 可扩展配置表单

- 凭据字段、Connector 字段、认证方式及其适用关系必须消费后端 options/catalog 返回的 Schema，前端不得按 `secretType`、`connectorCode` 复制字段清单或维护第二套产品常量。
- 页面只实现 `TEXT`、`PASSWORD`、`SECRET_TEXTAREA` 等通用控件类型，以及 required、maxLength、默认值和 `authProfileCodes` 等通用规则。遇到未知控件类型必须安全失败，不得猜测敏感字段的输入方式。
- 认证方式声明无需凭据时不展示凭据选择并提交 `null`；需要凭据时只展示后端按类型、用途和租户筛选后的引用。
- 连接目标预览只用于帮助用户确认配置，最终连接目标和协议约束始终以后端重新生成、校验的结果为准。

---

## 4. Modal / Drawer 异步安全与防卡死规范

### 4.1 数据传递（秒开托底）

- 编辑、详情等需要行快照的组件，在 `.open()` 前使用 `setData` 提供可立即展示的数据；新建和静态确认等无行数据场景不强制。

### 4.2 Loading 防卡死机制

- 异步初始化应先设置 `loading(true)`，并在 `finally` 中调用 `loading(false)`。同步初始化无需制造 Loading；禁止在异步任务开始前直接设置 `loading(false)` 来规避检查。

---

## 5. 安全与脱敏规范

- **敏感凭据管理**：列表页禁止显示敏感密码或明文 Token。凭据引用 `secretRef` 仅在详情页与轮换/编辑 Modal 中展示与复制。
- **权限指令**：受控业务操作使用 `v-access:code`；关闭、取消、展开等无权限语义的交互按钮无需绑定。

---

## 6. 测试代码规范

- 功能测试是交付代码的一部分。模块内的 `*.test.ts`、必要 Mock 和测试夹具必须与功能代码一起提交； `coverage/`、测试日志、临时截图、`dist/` 和 `dist.zip` 不得提交。
- 测试代码与生产代码执行同一套 Oxlint、ESLint、格式化和类型检查规则，不得以“只是测试”为理由规避门禁。
- 禁止使用 TypeScript 非空断言 `value!` 绕过空值检查。DOM 查询等场景先断言，再通过显式守卫完成类型收窄：

```ts
expect(input).not.toBeNull();
if (!input) {
  throw new Error('目标输入框未渲染');
}
input.value = 'value';
```

- 只有第三方类型缺陷且无法合理收窄时，才允许添加最小范围的规则禁用，并必须写明原因。
- 新功能至少覆盖关键数据契约和发生过的回归问题；修复缺陷时必须补充能够复现该缺陷的测试。

---

## 7. 提交门禁与 Git 约定

### 7.1 Lefthook 强制门禁

提交时 `lefthook.yml` 会依次执行以下检查，任意一项失败都会中止提交：

1. `oxlint`：对暂存的 JS、TS、TSX、Vue 等文件执行类型感知检查和自动修复。
2. `oxfmt`：格式化暂存文件并自动重新暂存修复结果。
3. `eslint`：执行 ESLint 自动修复并重新暂存。
4. `stylelint`：检查并修复 Vue、CSS、Less、SCSS 样式。
5. `checkType`：执行全仓 `pnpm check:type` 类型检查。
6. `commitlint`：在 `commit-msg` 阶段校验提交信息。

禁止使用 `--no-verify` 跳过门禁。提交失败不会丢失暂存内容；修复问题后重新 `git add` 被修改的文件并再次提交。

### 7.2 提交信息

提交信息遵循 `type(scope): 中文描述`：

```text
feat(@govdata/web-antd): 完成凭据管理页面
fix(@govdata/web-antd): 修复凭据详情加载失败
test(@govdata/web-antd): 补充凭据轮换回归测试
docs(project): 完善前端提交规范
```

- `type` 必须使用仓库 Commitlint 允许的类型，例如 `feat`、`fix`、`perf`、`style`、`docs`、`test`、 `refactor`、`build`、`ci`、`chore`、`revert`、`types`、`release`、`update`。
- `scope` 使用工作区包名或仓库公共范围。主应用页面和 API 统一使用 `@govdata/web-antd`，不得自行填写 `secret`、`datasource` 等领域名。
- 仓库公共范围包括 `project`、`style`、`lint`、`ci`、`dev`、`deploy`、`other`；公共包使用其 `package.json` 中的完整包名。允许范围以当前 Commitlint 配置输出为准。
- 描述必须明确说明本次提交产生的结果，不使用“修改代码”“更新一下”等模糊文案。

提交前可以单独验证提交信息：

```bash
echo "feat(@govdata/web-antd): 完成凭据管理页面" | pnpm exec commitlint
```

### 7.3 暂存与提交范围

- 一个提交只包含一个可独立说明、验证和回滚的功能；功能边界不等同于单个目录，必要的 API、测试、菜单和文档应随功能一起提交。
- 工作区存在其他改动时，先用 `git restore --staged .` 清理暂存区，再按明确路径重新暂存。该命令只取消暂存，不删除工作区代码。
- 提交前必须检查 `git diff --cached --name-only`、`git diff --cached --check` 和 `git diff --cached`。
- 一个功能分支承载一个完整交付目标；不要求一个物理模块建立一个分支，但禁止在同一功能分支混入无关目标。
