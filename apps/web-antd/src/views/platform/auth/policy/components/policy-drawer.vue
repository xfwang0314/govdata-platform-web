<script setup lang="ts">
import type { ID } from '#/api/common';
import type {
  AuthzOptionsView,
  PolicyGroupDraftCommand,
  PolicyRuleCommand,
  ResourceDescriptor,
  ResourceTreeNode,
  SubjectType,
} from '#/api/platform/auth/model';
import type { Role } from '#/api/system/role/model';
import type { DeptTree, User } from '#/api/system/user/model';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Divider,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  RadioGroup,
  Select,
  Space,
  TreeSelect,
} from 'antdv-next';

import {
  createPolicyGroupApi,
  getAuthzOptionsApi,
  getPolicyGroupApi,
  getResourceTreeApi,
  updatePolicyGroupDraftApi,
} from '#/api/platform/auth';
import { roleList } from '#/api/system/role';
import { getDeptTree, userList } from '#/api/system/user';

import { buildPolicyResourceTypeTree } from '../policy-resource-type-options';

interface SubjectEditor {
  ids: string[];
  includeChildren: boolean;
  key: number;
  type: SubjectType;
}

interface DepartmentTreeOption {
  children?: DepartmentTreeOption[];
  id: string;
  label: string;
}

interface RuleEditor {
  actions: string[];
  conditions: ConditionEditor[];
  includeChildren: boolean;
  key: number;
  obligationJson: string;
  purposes: string[];
  resourceIds: ID[];
  resourceScope: 'INSTANCE' | 'TYPE';
  resourceType?: string;
  resources: ResourceDescriptor[];
  resourceTree: ResourceTreeNode[];
  ruleCode?: string;
}

interface ConditionEditor {
  key: number;
  left?: string;
  operator?: string;
  rightAttribute?: string;
  rightMode: 'ATTRIBUTE' | 'CONSTANT';
  value?: unknown;
}

const emit = defineEmits<{ success: [] }>();

// 六种部门范围快捷预设定义
const DEPT_PRESETS = [
  {
    build: (_deptIds?: ID[]) => [
      {
        left: 'resource.ownerDeptPathIds',
        operator: 'CONTAINS',
        rightAttribute: 'subject.deptId',
        rightMode: 'ATTRIBUTE' as const,
        value: undefined,
      },
    ],
    key: 'DEPARTMENT_AND_DESCENDANTS',
    label: '本部门及以下数据',
  },
  {
    build: (_deptIds?: ID[]) => [
      {
        left: 'resource.ownerDeptId',
        operator: 'EQ',
        rightAttribute: 'subject.deptId',
        rightMode: 'ATTRIBUTE' as const,
        value: undefined,
      },
    ],
    key: 'DEPARTMENT',
    label: '本部门数据',
  },
  {
    build: (_deptIds?: ID[]) => [
      {
        left: 'resource.ownerUserId',
        operator: 'EQ',
        rightAttribute: 'subject.userId',
        rightMode: 'ATTRIBUTE' as const,
        value: undefined,
      },
    ],
    key: 'SELF',
    label: '仅本人数据',
  },
  {
    build: (_deptIds?: ID[]) => [
      {
        left: 'resource.ownerDeptPathIds',
        operator: 'CONTAINS',
        rightAttribute: 'subject.deptId',
        rightMode: 'ATTRIBUTE' as const,
        value: undefined,
      },
      {
        left: 'resource.ownerUserId',
        operator: 'EQ',
        rightAttribute: 'subject.userId',
        rightMode: 'ATTRIBUTE' as const,
        value: undefined,
      },
    ],
    key: 'DEPARTMENT_AND_DESCENDANTS_OR_SELF',
    label: '本部门及以下或本人',
  },
  {
    build: (deptIds?: ID[]) => [
      {
        left: 'resource.ownerDeptId',
        operator: 'IN',
        rightAttribute: undefined,
        rightMode: 'CONSTANT' as const,
        value: (deptIds ?? []).join(','),
      },
    ],
    key: 'CUSTOM',
    label: '自定义指定部门...',
  },
  {
    build: (_deptIds?: ID[]) => [],
    key: 'ALL',
    label: '清空条件（全部数据）',
  },
] as const;

const deptPresetMenuItems = DEPT_PRESETS.map((preset) => ({
  key: preset.key,
  label: preset.label,
}));

const visible = ref(false);
const loading = ref(false);
const submitting = ref(false);
const isReadonly = ref(false);
const options = ref<AuthzOptionsView | null>(null);
const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const departments = ref<DepartmentTreeOption[]>([]);
const editingCode = ref<string>();
const versionLockVersion = ref(0);
// 自定义部门选择器状态
const deptPickerVisible = ref(false);
const deptPickerSelectedIds = ref<ID[]>([]);
let pendingPresetRule: null | RuleEditor = null;
let sequence = 0;

const form = reactive({
  description: '',
  effect: 'PERMIT' as 'DENY' | 'PERMIT',
  policyName: '',
  priority: 100,
  riskLevel: 'LOW',
  subjects: [] as SubjectEditor[],
  rules: [] as RuleEditor[],
});

const subjectTypeOptions = computed(() => options.value?.subjectTypes ?? []);
const riskOptions = computed(() => options.value?.policyRiskLevels ?? []);
const effectOptions = computed(() => options.value?.policyEffects ?? []);
const departmentTreeFieldNames = {
  children: 'children',
  label: 'label',
  value: 'id',
} as const;

function mapDepartmentTree(nodes: DeptTree[]): DepartmentTreeOption[] {
  return nodes.map((node) => ({
    children: node.children ? mapDepartmentTree(node.children) : undefined,
    id: String(node.id),
    label: node.label,
  }));
}

function newSubject(type: SubjectType = 'HUMAN'): SubjectEditor {
  return { ids: [], includeChildren: false, key: ++sequence, type };
}

function newRule(): RuleEditor {
  return {
    actions: [],
    conditions: [],
    includeChildren: false,
    key: ++sequence,
    obligationJson: '',
    purposes: [],
    resourceIds: [],
    resourceScope: 'TYPE',
    resources: [],
    resourceTree: [],
  };
}

function reset() {
  isReadonly.value = false;
  Object.assign(form, {
    description: '',
    effect: 'PERMIT',
    policyName: '',
    priority: 100,
    riskLevel: 'LOW',
    subjects: [newSubject()],
    rules: [newRule()],
  });
  editingCode.value = undefined;
  versionLockVersion.value = 0;
}

async function ensureReferences() {
  const [authzOptions, userPage, rolePage, deptTree] = await Promise.all([
    getAuthzOptionsApi(),
    userList({ pageNum: 1, pageSize: 500, status: '0' }),
    roleList({ pageNum: 1, pageSize: 500, status: '0' }),
    departments.value.length > 0 ? Promise.resolve([]) : getDeptTree(),
  ]);
  options.value = authzOptions;
  if (userPage.rows) users.value = userPage.rows;
  if (rolePage.rows) roles.value = rolePage.rows;
  if (deptTree.length > 0) departments.value = mapDepartmentTree(deptTree);
}

async function open(groupCode?: string, readonlyMode = false) {
  reset();
  isReadonly.value = readonlyMode;
  visible.value = true;
  loading.value = true;
  try {
    await ensureReferences();
    if (!groupCode) return;
    const group = await getPolicyGroupApi(groupCode);
    const version = readonlyMode
      ? (group.currentVersion ?? group.draftVersion)
      : group.draftVersion;
    const document = version?.document;
    if (!document || !version) {
      message.warning('未找到可查看或编辑的策略版本');
      visible.value = false;
      return;
    }
    editingCode.value = group.policyGroupCode;
    versionLockVersion.value = version.lockVersion;
    form.policyName = document.policyName;
    form.description = document.description ?? '';
    form.effect = document.effect;
    form.riskLevel = document.riskLevel;
    form.priority = document.priority;
    form.subjects = document.subjects.items.map((item) => ({
      ids: [item.subjectId],
      includeChildren: item.includeChildren,
      key: ++sequence,
      type: item.subjectType,
    }));
    form.rules = document.rules.map((rule) => ({
      actions: [...rule.actions],
      conditions: parseConditions(rule.conditionJson),
      includeChildren: rule.targets.some((item) => item.includeChildren),
      key: ++sequence,
      obligationJson: rule.obligationJson ?? '',
      purposes: [...rule.purposes],
      resourceIds: rule.targets.map((item) => item.resourceId),
      resourceScope: rule.resourceScope,
      resourceType: rule.resourceType,
      resources: [],
      resourceTree: [],
      ruleCode: rule.ruleCode,
    }));
    await Promise.all(form.rules.map((rule) => loadResources(rule)));
  } finally {
    loading.value = false;
  }
}

function subjectOptions(subject: SubjectEditor) {
  if (subject.type === 'HUMAN') {
    return users.value.map((item) => ({
      label: `${item.nickName}（${item.userName}）`,
      value: String(item.userId),
    }));
  }
  if (subject.type === 'ROLE') {
    return roles.value.map((item) => ({
      label: `${item.roleName}（${item.roleKey}）`,
      value: String(item.roleId),
    }));
  }
  return [];
}

function changeSubjectType(subject: SubjectEditor) {
  subject.ids = subject.type === 'ANY' ? ['*'] : [];
  subject.includeChildren = false;
}

function resourceTypeTreeData() {
  return buildPolicyResourceTypeTree(options.value?.resourceTypes ?? []);
}

function selectedType(rule: RuleEditor) {
  return options.value?.resourceTypes.find(
    (item) => item.typeCode === rule.resourceType,
  );
}

function purposeOptions(rule: RuleEditor) {
  return selectedType(rule)?.purposes ?? [];
}

function parseConditions(json?: string): ConditionEditor[] {
  if (!json) return [];
  try {
    const group = JSON.parse(json) as {
      conditions?: Array<{
        left?: string;
        operator?: string;
        rightAttribute?: string;
        value?: unknown;
      }>;
    };
    return (group.conditions ?? []).map((item) => ({
      ...item,
      key: ++sequence,
      rightMode: item.rightAttribute ? 'ATTRIBUTE' : 'CONSTANT',
    }));
  } catch {
    return [];
  }
}

function attributeOptions(rule: RuleEditor, side: 'LEFT' | 'RIGHT') {
  return (selectedType(rule)?.attributes ?? [])
    .filter((item) => item.operandRole === 'BOTH' || item.operandRole === side)
    .map((item) => ({ label: item.label, value: item.path }));
}

function operatorOptions(rule: RuleEditor, condition: ConditionEditor) {
  const attribute = selectedType(rule)?.attributes.find(
    (item) => item.path === condition.left,
  );
  return (options.value?.operators ?? []).filter((item) =>
    attribute?.operators.includes(item.value),
  );
}

function resetCondition(condition: ConditionEditor) {
  condition.operator = undefined;
  condition.rightAttribute = undefined;
  condition.value = undefined;
}

function conditionJson(rule: RuleEditor) {
  if (rule.conditions.length === 0) return undefined;
  const conditions = rule.conditions.map((item) => ({
    left: item.left,
    operator: item.operator,
    rightAttribute:
      expectsRight(item) && item.rightMode === 'ATTRIBUTE'
        ? item.rightAttribute
        : undefined,
    value:
      expectsRight(item) && item.rightMode === 'CONSTANT'
        ? normalizeConditionValue(rule, item)
        : undefined,
  }));
  return JSON.stringify({ conditions, groups: [], logic: 'ALL' });
}

function expectsRight(condition: ConditionEditor) {
  return condition.operator !== 'EXISTS' && condition.operator !== 'NOT_EXISTS';
}

function normalizeConditionValue(rule: RuleEditor, condition: ConditionEditor) {
  const attribute = selectedType(rule)?.attributes.find(
    (item) => item.path === condition.left,
  );
  if (attribute?.valueType === 'INTEGER') return Number(condition.value);
  if (attribute?.valueType === 'BOOLEAN')
    return String(condition.value) === 'true';
  if (
    attribute?.valueType.endsWith('_SET') &&
    typeof condition.value === 'string'
  ) {
    return condition.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) =>
        attribute.valueType === 'INTEGER_SET' ? Number(item) : item,
      );
  }
  return condition.value;
}

async function loadResources(rule: RuleEditor) {
  rule.resources = [];
  rule.resourceTree = [];
  if (!rule.resourceType || rule.resourceScope !== 'INSTANCE') return;
  const tree = await getResourceTreeApi(rule.resourceType);
  rule.resourceTree = tree;
}

async function changeResourceType(rule: RuleEditor) {
  rule.actions = [];
  rule.purposes = [];
  rule.resourceIds = [];
  await loadResources(rule);
}

// ── 条件快捷预设 ──────────────────────────────────────────────────────────────

function applyDeptPreset(rule: RuleEditor, presetKey: string) {
  const preset = DEPT_PRESETS.find((p) => p.key === presetKey);
  if (!preset) return;
  if (preset.key === 'CUSTOM') {
    pendingPresetRule = rule;
    deptPickerSelectedIds.value = [];
    deptPickerVisible.value = true;
    return;
  }
  rule.conditions = preset.build([]).map((c) => ({ ...c, key: ++sequence }));
}

function confirmDeptPicker() {
  if (!pendingPresetRule) return;
  const rawIds = (deptPickerSelectedIds.value || []).map((item: any) =>
    typeof item === 'object' && item !== null && 'value' in item
      ? item.value
      : item,
  );
  if (rawIds.length === 0) {
    message.warning('请至少选择一个部门');
    return;
  }
  const preset = DEPT_PRESETS.find((p) => p.key === 'CUSTOM');
  if (preset) {
    pendingPresetRule.conditions = preset.build(rawIds).map((c) => ({
      ...c,
      key: ++sequence,
    }));
  }
  deptPickerVisible.value = false;
  pendingPresetRule = null;
}

// ─────────────────────────────────────────────────────────────────────────────

function validate() {
  if (!form.policyName.trim()) return '请输入策略名称';
  if (form.subjects.length === 0) return '至少配置一组授权主体';
  if (form.subjects.some((item) => item.ids.length === 0)) {
    return '每组授权主体都必须选择稳定标识';
  }
  if (form.rules.length === 0) return '至少配置一条资源规则';
  for (const rule of form.rules) {
    if (!rule.resourceType) return '请选择资源类型';
    if (rule.actions.length === 0) return '每条规则至少选择一个动作';
    if (rule.purposes.length === 0) return '每条规则至少选择一个访问目的';
    if (
      rule.resourceScope === 'INSTANCE' &&
      (!rule.resourceIds || rule.resourceIds.length === 0)
    ) {
      return '指定资源规则至少选择一个资源实例';
    }
    if (
      rule.conditions.some(
        (item) =>
          !item.left ||
          !item.operator ||
          (expectsRight(item) &&
            (item.rightMode === 'ATTRIBUTE'
              ? !item.rightAttribute
              : item.value === undefined || item.value === '')),
      )
    ) {
      return '动态条件的属性、运算符和比较值必须填写完整';
    }
  }
  return undefined;
}

function command(): PolicyGroupDraftCommand {
  const rules: PolicyRuleCommand[] = form.rules.map((rule) => {
    const normalizedResourceIds: ID[] = (rule.resourceIds || []).map(
      (item: any) =>
        typeof item === 'object' && item !== null && 'value' in item
          ? item.value
          : item,
    );
    return {
      actions: rule.actions,
      conditionJson: conditionJson(rule),
      obligationJson: rule.obligationJson.trim() || undefined,
      purposes: rule.purposes,
      resourceScope: rule.resourceScope,
      resourceType: requireResourceType(rule),
      ruleCode: rule.ruleCode,
      targets:
        rule.resourceScope === 'INSTANCE'
          ? normalizedResourceIds.map((resourceId) => ({
              includeChildren: rule.includeChildren,
              resourceId,
            }))
          : [],
    };
  });
  return {
    description: form.description.trim() || undefined,
    effect: form.effect,
    policyName: form.policyName.trim(),
    priority: form.priority,
    riskLevel: form.riskLevel,
    rules,
    subjectOperator: 'ANY',
    subjects: form.subjects.flatMap((subject) =>
      subject.ids.map((subjectId) => ({
        includeChildren: subject.includeChildren,
        subjectId,
        subjectType: subject.type,
      })),
    ),
  };
}

function requireResourceType(rule: RuleEditor) {
  if (!rule.resourceType) {
    throw new Error('资源类型未选择');
  }
  return rule.resourceType;
}

async function submit() {
  const problem = validate();
  if (problem) {
    message.warning(problem);
    return;
  }
  submitting.value = true;
  try {
    if (editingCode.value) {
      await updatePolicyGroupDraftApi(editingCode.value, {
        ...command(),
        versionLockVersion: versionLockVersion.value,
      });
      message.success('待发布版本已保存');
    } else {
      await createPolicyGroupApi(command());
      message.success('首个待发布版本已创建');
    }
    visible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :body-style="{ padding: '20px 28px 88px' }"
    :destroy-on-close="true"
    :loading="loading"
    :title="
      isReadonly
        ? `策略组详情 · ${editingCode}`
        : editingCode
          ? `编辑待发布版本 · ${editingCode}`
          : '新建 ABAC 策略组'
    "
    width="min(1120px, 92vw)"
  >
    <Form layout="vertical">
      <section class="policy-section">
        <div class="section-index">01</div>
        <div class="section-body">
          <div class="section-heading">
            <div>
              <h3>策略基本信息</h3>
              <p>名称与效果随版本保存，发布后形成不可变审计快照。</p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-x-5 md:grid-cols-2">
            <FormItem label="策略名称" required>
              <Input
                v-model:value="form.policyName"
                :maxlength="200"
                placeholder="例如：省级数据源只读访问"
              />
            </FormItem>
            <FormItem label="决策效果" required>
              <Select v-model:value="form.effect" :options="effectOptions" />
            </FormItem>
            <FormItem label="风险等级" required>
              <Select v-model:value="form.riskLevel" :options="riskOptions" />
            </FormItem>
            <FormItem label="优先级">
              <InputNumber
                v-model:value="form.priority"
                :min="0"
                :max="10000"
                class="w-full"
              />
            </FormItem>
          </div>

          <FormItem label="策略说明">
            <Input.TextArea
              v-model:value="form.description"
              :rows="2"
              :maxlength="1000"
              placeholder="说明策略的业务目的、适用边界和维护责任"
            />
          </FormItem>
        </div>
      </section>

      <section class="policy-section">
        <div class="section-index">02</div>
        <div class="section-body">
          <div class="section-heading">
            <div>
              <h3>适用主体</h3>
              <p>同一策略组内主体按“任一匹配”计算；部门可显式包含下级部门。</p>
            </div>
            <Button
              v-if="!isReadonly"
              @click="form.subjects.push(newSubject())"
            >
              添加主体组
            </Button>
          </div>
          <Card
            v-for="(subject, index) in form.subjects"
            :key="subject.key"
            class="mb-3"
            size="small"
          >
            <div
              class="grid grid-cols-1 items-end gap-4"
              :class="
                isReadonly
                  ? 'md:grid-cols-[180px_1fr_auto]'
                  : 'md:grid-cols-[180px_1fr_auto_auto]'
              "
            >
              <FormItem label="主体类型" required>
                <Select
                  v-model:value="subject.type"
                  :options="subjectTypeOptions"
                  @change="changeSubjectType(subject)"
                />
              </FormItem>
              <FormItem label="主体稳定标识" required>
                <TreeSelect
                  v-if="subject.type === 'DEPARTMENT'"
                  v-model:value="subject.ids"
                  :field-names="departmentTreeFieldNames"
                  :tree-data="departments"
                  multiple
                  tree-checkable
                  allow-clear
                  placeholder="选择一个或多个部门"
                />
                <Select
                  v-else-if="
                    subject.type === 'HUMAN' || subject.type === 'ROLE'
                  "
                  v-model:value="subject.ids"
                  :options="subjectOptions(subject)"
                  mode="multiple"
                  show-search
                  option-filter-prop="label"
                  placeholder="选择一个或多个主体"
                />
                <Input
                  v-else-if="subject.type === 'ANY'"
                  value="所有主体（*）"
                  disabled
                />
                <Select
                  v-else
                  v-model:value="subject.ids"
                  mode="tags"
                  placeholder="输入服务或 Agent 稳定标识"
                />
              </FormItem>
              <FormItem v-if="subject.type === 'DEPARTMENT'" label="包含下级">
                <Switch v-model:checked="subject.includeChildren" />
              </FormItem>
              <Button
                v-if="!isReadonly"
                danger
                type="text"
                :disabled="form.subjects.length === 1"
                @click="form.subjects.splice(index, 1)"
              >
                删除
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <section class="policy-section">
        <div class="section-index">03</div>
        <div class="section-body">
          <div class="section-heading">
            <div>
              <h3>资源授权规则</h3>
              <p>
                一条规则只对应一种资源类型，可授权同类型全部资源或多个指定实例。
              </p>
            </div>
            <Button
              v-if="!isReadonly"
              type="primary"
              ghost
              @click="form.rules.push(newRule())"
            >
              添加规则
            </Button>
          </div>
          <Card
            v-for="(rule, index) in form.rules"
            :key="rule.key"
            class="rule-card"
            size="small"
          >
            <template #title>规则 {{ index + 1 }}</template>
            <template #extra>
              <Button
                danger
                type="link"
                :disabled="form.rules.length === 1"
                @click="form.rules.splice(index, 1)"
              >
                删除
              </Button>
            </template>
            <div class="grid grid-cols-1 gap-x-5 md:grid-cols-2">
              <FormItem label="资源类型" required>
                <TreeSelect
                  v-model:value="rule.resourceType"
                  :tree-data="resourceTypeTreeData()"
                  placeholder="请选择资源类型"
                  show-search
                  tree-default-expand-all
                  tree-node-filter-prop="label"
                  @change="changeResourceType(rule)"
                />
              </FormItem>
              <FormItem label="资源范围" required>
                <RadioGroup
                  v-model:value="rule.resourceScope"
                  :options="[
                    { label: '同类型全部资源', value: 'TYPE' },
                    { label: '指定资源实例', value: 'INSTANCE' },
                  ]"
                  @change="loadResources(rule)"
                />
              </FormItem>
              <FormItem
                v-if="rule.resourceScope === 'INSTANCE'"
                class="md:col-span-2"
                label="授权资源"
                required
              >
                <TreeSelect
                  v-model:value="rule.resourceIds"
                  :field-names="{
                    label: 'label',
                    value: 'id',
                    children: 'children',
                  }"
                  :show-checked-strategy="TreeSelect.SHOW_ALL"
                  :tree-data="rule.resourceTree"
                  allow-clear
                  multiple
                  tree-check-strictly
                  placeholder="可选择多个资源实例（支持跨层级独立选择）"
                  show-search
                  tree-checkable
                  tree-default-expand-all
                  tree-node-filter-prop="label"
                />
              </FormItem>
              <FormItem label="允许动作" required>
                <Select
                  v-model:value="rule.actions"
                  :options="selectedType(rule)?.actions ?? []"
                  mode="multiple"
                />
              </FormItem>
              <FormItem label="访问目的" required>
                <Select
                  v-model:value="rule.purposes"
                  :options="purposeOptions(rule)"
                  mode="multiple"
                  placeholder="请选择该资源类型允许的访问目的"
                />
              </FormItem>
            </div>
            <Divider class="my-3" />
            <div class="condition-heading">
              <div>
                <strong>动态属性条件</strong><span>同一规则内按"全部满足"计算</span>
              </div>
              <Space v-if="!isReadonly" :size="6">
                <!-- ⚡ 快捷套用部门范围条件 -->
                <Dropdown
                  :menu="{
                    items: deptPresetMenuItems,
                    onClick: ({ key }: { key: string | number }) =>
                      applyDeptPreset(rule, String(key)),
                  }"
                  :trigger="['click']"
                >
                  <Button size="small" type="dashed">⚡ 套用部门条件</Button>
                </Dropdown>
                <Button
                  size="small"
                  @click="
                    rule.conditions.push({
                      key: ++sequence,
                      rightMode: 'CONSTANT',
                    })
                  "
                >
                  添加条件
                </Button>
              </Space>
            </div>
            <div
              v-for="(condition, conditionIndex) in rule.conditions"
              :key="condition.key"
              class="condition-row"
              :class="isReadonly ? 'condition-row-readonly' : ''"
            >
              <Select
                v-model:value="condition.left"
                :options="attributeOptions(rule, 'LEFT')"
                placeholder="条件属性"
                @change="resetCondition(condition)"
              />
              <Select
                v-model:value="condition.operator"
                :options="operatorOptions(rule, condition)"
                placeholder="运算符"
              />
              <Select
                v-model:value="condition.rightMode"
                :disabled="!expectsRight(condition)"
                :options="[
                  { label: '与固定值比较', value: 'CONSTANT' },
                  { label: '与另一属性比较', value: 'ATTRIBUTE' },
                ]"
              />
              <Input
                v-if="!expectsRight(condition)"
                value="无需比较值"
                disabled
              />
              <Select
                v-else-if="condition.rightMode === 'ATTRIBUTE'"
                v-model:value="condition.rightAttribute"
                :options="attributeOptions(rule, 'RIGHT')"
                placeholder="右侧属性"
              />
              <Input
                v-else
                v-model:value="condition.value"
                placeholder="固定值；集合用逗号分隔"
              />
              <Button
                v-if="!isReadonly"
                danger
                type="text"
                @click="rule.conditions.splice(conditionIndex, 1)"
              >
                删除
              </Button>
            </div>
            <FormItem class="mt-3" label="决策义务（JSON）">
              <Input.TextArea
                v-model:value="rule.obligationJson"
                :rows="2"
                placeholder="可选：字段白名单、脱敏、最大行数、禁导出等结构化义务"
              />
            </FormItem>
          </Card>
        </div>
      </section>
    </Form>

    <!-- 自定义部门选择器弹窗 -->
    <Modal
      v-model:open="deptPickerVisible"
      title="选择自定义授权部门"
      ok-text="确认套用"
      cancel-text="取消"
      @ok="confirmDeptPicker"
    >
      <p class="mb-3 text-sm text-muted-foreground">
        选中部门后将生成
        <code>resource.ownerDeptId IN [...]</code>
        条件，范围限于选中部门（不含子部门）。
      </p>
      <TreeSelect
        v-model:value="deptPickerSelectedIds"
        :field-names="departmentTreeFieldNames"
        :show-checked-strategy="TreeSelect.SHOW_ALL"
        :tree-data="departments"
        class="w-full"
        multiple
        tree-checkable
        tree-check-strictly
        allow-clear
        placeholder="选择授权范围内的部门"
      />
    </Modal>

    <template #footer>
      <Space>
        <Button @click="visible = false">
          {{ isReadonly ? '关闭' : '取消' }}
        </Button>
        <Button
          v-if="!isReadonly"
          type="primary"
          :loading="submitting"
          @click="submit"
        >
          {{ editingCode ? '保存待发布版本' : '创建待发布版本' }}
        </Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.policy-section {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  margin-bottom: 18px;
  overflow: hidden;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.section-index {
  padding-top: 20px;
  font-weight: 700;
  color: hsl(var(--primary));
  text-align: center;
  background: color-mix(in srgb, hsl(var(--primary)) 7%, transparent);
}

.section-body {
  min-width: 0;
  padding: 20px;
}

.section-heading {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-heading h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
}

.section-heading p {
  margin: 4px 0 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.rule-card {
  margin-bottom: 14px;
  border-color: color-mix(in srgb, hsl(var(--primary)) 18%, hsl(var(--border)));
}

.condition-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.condition-heading span {
  margin-left: 10px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.condition-row {
  display: grid;
  grid-template-columns:
    minmax(150px, 1.2fr) minmax(110px, 0.8fr) minmax(140px, 1fr)
    minmax(180px, 1.4fr) auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.condition-row-readonly {
  grid-template-columns:
    minmax(150px, 1.2fr) minmax(110px, 0.8fr) minmax(140px, 1fr)
    minmax(180px, 1.4fr);
}

@media (width <= 900px) {
  .condition-row {
    grid-template-columns: 1fr;
  }
}

:deep(.ant-form-item) {
  margin-bottom: 14px;
}
</style>
