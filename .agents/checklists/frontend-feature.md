# 前端功能开发检查清单 (Frontend Feature Checklist)

## 开发前

- [ ] 已阅读 `.docs/standards/frontend-coding.md` 和 `AGENTS.md`。
- [ ] 已确认功能归属的领域目录（`views/<domain>/<module>/` 和 `api/<domain>/<module>/`）。
- [ ] 已确认 API 请求集中收口在 `api/<domain>/<module>/index.ts`，类型在 `model.d.ts` 中定义。

## 设计与实现

- [ ] 页面主入口命名为 `index.vue`，配置数据存放在 `data.tsx`。
- [ ] 组件较多时使用 `components/` 子目录；未机械移动无关既有文件。
- [ ] 新组件命名与当前模块一致且带有明确功能后缀。
- [ ] 已注册全局组件和 `antdv-next` 显式导入使用一致，无未注册标签。
- [ ] 布局优先使用 Tailwind；复杂样式已局部隔离，无无依据内联样式。
- [ ] 使用 `useVbenVxeGrid` 和 `useVbenForm` 驱动列表与搜索条件。
- [ ] 需要行快照的 Modal/Drawer 在打开前通过 `setData` 提供数据。
- [ ] 异步初始化使用 `loading(true)` 与 `try/finally`，同步初始化未制造无意义 Loading。
- [ ] 受控业务按钮绑定权限码，普通交互按钮未滥用权限指令。

## 验证

- [ ] 功能测试、必要 Mock 和测试夹具已与功能代码一起纳入提交范围。
- [ ] 测试代码未使用非空断言 `value!`、无依据规则禁用或跳过测试规避门禁。
- [ ] 已执行模块相关的 Vitest 测试，新增缺陷修复已有对应回归用例。
- [ ] 页面无 Oxlint、TypeScript、ESLint 和 Stylelint 错误。
- [ ] 页面响应流畅，在亮色/深色主题下视觉样式正常。
- [ ] 执行了 `pnpm --filter @govdata/web-antd run typecheck` 验证。

## 提交前

- [ ] 已使用 `git diff --cached --name-only` 确认暂存区只包含当前功能及其 API、测试和必要文档。
- [ ] 已执行 `git diff --cached --check`，不存在空白符或冲突标记问题。
- [ ] 未提交 `coverage/`、测试日志、临时截图、`dist/`、`dist.zip` 等生成物。
- [ ] 主应用提交 scope 使用 `@govdata/web-antd`，例如
  `feat(@govdata/web-antd): 完成凭据管理页面`，未使用 `secret` 等自定义 scope。
- [ ] Commitlint、Oxlint、Oxfmt、ESLint、Stylelint 和 CheckType 门禁全部通过，未使用 `--no-verify`。
- [ ] 钩子自动修改文件或提交失败后，已重新检查并暂存被修改的文件。
