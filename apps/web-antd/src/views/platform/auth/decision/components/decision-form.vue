<script setup lang="ts">
import type { ID } from '#/api/common';
import type {
  AuthzOptionsView,
  ResourceTreeNode,
} from '#/api/platform/auth/model';
import type { Role } from '#/api/system/role/model';
import type { DeptTree, User } from '#/api/system/user/model';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  message,
  RadioButton,
  RadioGroup,
  Select,
  Space,
  TreeSelect,
} from 'antdv-next';

import { getAuthzOptionsApi, getResourceTreeApi } from '#/api/platform/auth';
import { roleList } from '#/api/system/role';
import { getDeptTree, userList } from '#/api/system/user';

export type SubjectMode = 'CURRENT' | 'DEPARTMENT' | 'HUMAN' | 'ROLE';

export interface DecisionSimulationParams {
  actions: string[];
  purposes: string[];
  resourceIds: ID[];
  resourceType: string;
  sourceModule: string;
  subjectId?: string;
  subjectMode: SubjectMode;
  subjectType?: 'DEPARTMENT' | 'HUMAN' | 'ROLE';
}

defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  evaluate: [params: DecisionSimulationParams];
  reset: [];
}>();

const options = ref<AuthzOptionsView | null>(null);
const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const departments = ref<DeptTree[]>([]);

const loadingUsers = ref(false);
const loadingRoles = ref(false);
const loadingDepts = ref(false);

const resourceTree = ref<ResourceTreeNode[]>([]);
const loadingResources = ref(false);

const form = reactive<{
  actions: string[];
  deptId?: ID;
  purposes: string[];
  resourceIds: ID[];
  resourceType?: string;
  roleId?: ID;
  sourceModule?: string;
  subjectMode: SubjectMode;
  userId?: ID;
}>({
  actions: [],
  deptId: undefined,
  purposes: [],
  resourceIds: [],
  resourceType: undefined,
  roleId: undefined,
  sourceModule: undefined,
  subjectMode: 'CURRENT',
  userId: undefined,
});

/** 过滤出具备 INSTANCE_DECISION 能力（有实体资源）的来源模块，排除无实体资源的纯系统管理模块 */
const availableModules = computed(() => {
  if (!options.value) return [];
  const validModuleCodes = new Set(
    options.value.resourceTypes
      .filter((type) => type.capabilities.includes('INSTANCE_DECISION'))
      .map((type) => type.sourceModule),
  );
  return options.value.resourceModules.filter((mod) =>
    validModuleCodes.has(mod.value),
  );
});

const selectedType = computed(() =>
  options.value?.resourceTypes.find(
    (item) => item.typeCode === form.resourceType,
  ),
);

const resourceTypeOptions = computed(
  () =>
    options.value?.resourceTypes
      .filter(
        (item) =>
          item.sourceModule === form.sourceModule &&
          item.capabilities.includes('INSTANCE_DECISION'),
      )
      .map((item) => ({
        label: `${item.typeLabel}（${item.typeCode}）`,
        value: item.typeCode,
      })) ?? [],
);

const actionOptions = computed(() => selectedType.value?.actions ?? []);
const purposeOptions = computed(() => selectedType.value?.purposes ?? []);

function handleSubjectModeChange() {
  form.userId = undefined;
  form.deptId = undefined;
  form.roleId = undefined;
  if (form.subjectMode === 'HUMAN' && users.value.length === 0) {
    loadUsers();
  } else if (form.subjectMode === 'ROLE' && roles.value.length === 0) {
    loadRoles();
  } else if (
    form.subjectMode === 'DEPARTMENT' &&
    departments.value.length === 0
  ) {
    loadDepts();
  }
}

async function loadUsers() {
  loadingUsers.value = true;
  try {
    const res = await userList({ pageNum: 1, pageSize: 500, status: '0' });
    users.value = res.rows || [];
  } finally {
    loadingUsers.value = false;
  }
}

async function loadRoles() {
  loadingRoles.value = true;
  try {
    const res = await roleList({ pageNum: 1, pageSize: 500, status: '0' });
    roles.value = res.rows || [];
  } finally {
    loadingRoles.value = false;
  }
}

async function loadDepts() {
  loadingDepts.value = true;
  try {
    departments.value = await getDeptTree();
  } finally {
    loadingDepts.value = false;
  }
}

function handleModuleChange() {
  form.resourceType = undefined;
  form.resourceIds = [];
  form.actions = [];
  form.purposes = [];
  resourceTree.value = [];
}

async function loadResources() {
  form.resourceIds = [];
  form.actions = [];
  form.purposes = [];
  if (!form.resourceType) {
    resourceTree.value = [];
    return;
  }
  loadingResources.value = true;
  try {
    resourceTree.value = await getResourceTreeApi(form.resourceType, 'ACTIVE');
  } finally {
    loadingResources.value = false;
  }
}

function extractNodeIds(nodes: ResourceTreeNode[]): ID[] {
  const ids: ID[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      ids.push(...extractNodeIds(node.children));
    }
  }
  return ids;
}

function selectAllResources() {
  form.resourceIds = extractNodeIds(resourceTree.value);
}

function clearResources() {
  form.resourceIds = [];
}

function selectAllActions() {
  form.actions = actionOptions.value.map((item) => item.value);
}

function clearActions() {
  form.actions = [];
}

function selectAllPurposes() {
  form.purposes = purposeOptions.value.map((item) => item.value);
}

function clearPurposes() {
  form.purposes = [];
}

function handleReset() {
  form.subjectMode = 'CURRENT';
  form.userId = undefined;
  form.deptId = undefined;
  form.roleId = undefined;
  form.sourceModule = undefined;
  form.resourceType = undefined;
  form.resourceIds = [];
  form.actions = [];
  form.purposes = [];
  resourceTree.value = [];
  emit('reset');
}

function handleSubmit() {
  if (form.subjectMode === 'HUMAN' && !form.userId) {
    message.warning('请选择要模拟验证的具体用户');
    return;
  }
  if (form.subjectMode === 'ROLE' && !form.roleId) {
    message.warning('请选择要模拟验证的角色');
    return;
  }
  if (form.subjectMode === 'DEPARTMENT' && !form.deptId) {
    message.warning('请选择要模拟验证的部门');
    return;
  }
  if (!form.sourceModule || !form.resourceType) {
    message.warning('请选择来源模块和资源类型');
    return;
  }
  if (form.resourceIds.length === 0) {
    message.warning('请至少选择一个目标资源实体');
    return;
  }
  if (form.actions.length === 0) {
    message.warning('请至少选择一个请求动作');
    return;
  }
  if (form.purposes.length === 0) {
    message.warning('请至少选择一个访问用途（必选项）');
    return;
  }

  let subjectId: string | undefined;
  let subjectType: 'DEPARTMENT' | 'HUMAN' | 'ROLE' | undefined;
  switch (form.subjectMode) {
    case 'DEPARTMENT': {
      subjectType = 'DEPARTMENT';
      subjectId = String(form.deptId);

      break;
    }
    case 'HUMAN': {
      subjectType = 'HUMAN';
      subjectId = String(form.userId);

      break;
    }
    case 'ROLE': {
      subjectType = 'ROLE';
      subjectId = String(form.roleId);

      break;
    }
    // No default
  }

  emit('evaluate', {
    actions: [...form.actions],
    purposes: [...form.purposes],
    resourceIds: [...form.resourceIds],
    resourceType: form.resourceType,
    sourceModule: form.sourceModule,
    subjectId,
    subjectMode: form.subjectMode,
    subjectType,
  });
}

onMounted(async () => {
  options.value = await getAuthzOptionsApi();
});
</script>

<template>
  <section class="overflow-hidden rounded-xl border bg-card shadow-sm">
    <header
      class="flex flex-col gap-2 border-b px-6 py-4 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-base font-bold tracking-tight text-foreground">
            授权决策排障与验证
          </h2>
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            <span
              class="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"
            ></span>
            实时决策沙箱
          </span>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          可代入当前主体、指定用户、部门或角色身份，对树形实体资源与操作动作进行批量
          ABAC 策略与 Grant 凭证实时匹配验证。
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button @click="handleReset"> 重置参数 </Button>
        <Button type="primary" :loading="loading" @click="handleSubmit">
          执行验证
        </Button>
      </div>
    </header>

    <div class="divide-y">
      <section class="grid gap-6 px-6 py-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <div class="flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary"
            >
              01
            </span>
            <h3 class="font-semibold text-foreground text-sm">验证主体</h3>
          </div>
          <p class="mt-1.5 pl-8 text-xs text-muted-foreground">
            支持选择当前登录账号自身，或代入指定用户、部门、角色身份进行授权排查。
          </p>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-foreground">
              主体类型 <span class="text-rose-500">*</span>
            </label>
            <RadioGroup
              v-model:value="form.subjectMode"
              button-style="solid"
              @change="handleSubjectModeChange"
            >
              <RadioButton value="CURRENT">当前登录账号（自己）</RadioButton>
              <RadioButton value="HUMAN">指定用户</RadioButton>
              <RadioButton value="DEPARTMENT">部门</RadioButton>
              <RadioButton value="ROLE">角色</RadioButton>
            </RadioGroup>
          </div>

          <div v-if="form.subjectMode === 'HUMAN'">
            <label class="mb-1.5 block text-xs font-medium text-foreground">
              选择用户 <span class="text-rose-500">*</span>
            </label>
            <Select
              v-model:value="form.userId"
              class="w-full"
              show-search
              option-filter-prop="label"
              placeholder="搜索或选择目标用户"
              :loading="loadingUsers"
              :options="
                users.map((u) => ({
                  label: `${u.nickName}（${u.userName}）`,
                  value: u.userId,
                }))
              "
            />
          </div>

          <div v-else-if="form.subjectMode === 'DEPARTMENT'">
            <label class="mb-1.5 block text-xs font-medium text-foreground">
              选择部门 <span class="text-rose-500">*</span>
            </label>
            <TreeSelect
              v-model:value="form.deptId"
              class="w-full"
              :tree-data="departments"
              :field-names="{
                label: 'label',
                value: 'id',
                children: 'children',
              }"
              show-search
              tree-node-filter-prop="label"
              tree-default-expand-all
              placeholder="请选择目标部门"
              :loading="loadingDepts"
            />
          </div>

          <div v-else-if="form.subjectMode === 'ROLE'">
            <label class="mb-1.5 block text-xs font-medium text-foreground">
              选择角色 <span class="text-rose-500">*</span>
            </label>
            <Select
              v-model:value="form.roleId"
              class="w-full"
              show-search
              option-filter-prop="label"
              placeholder="搜索或选择目标角色"
              :loading="loadingRoles"
              :options="
                roles.map((r) => ({
                  label: `${r.roleName}（${r.roleKey}）`,
                  value: r.roleId,
                }))
              "
            />
          </div>
        </div>
      </section>

      <section class="grid gap-6 px-6 py-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <div class="flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary"
            >
              02
            </span>
            <h3 class="font-semibold text-foreground text-sm">目标资源</h3>
          </div>
          <p class="mt-1.5 pl-8 text-xs text-muted-foreground">
            选择业务来源模块及资源类型，实体支持树形多选及一键全选。
          </p>
        </div>
        <div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-foreground">
              来源模块 <span class="text-rose-500">*</span>
            </label>
            <Select
              v-model:value="form.sourceModule"
              class="w-full"
              placeholder="请选择来源模块"
              :options="availableModules"
              @change="handleModuleChange"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-foreground">
              资源类型 <span class="text-rose-500">*</span>
            </label>
            <Select
              v-model:value="form.resourceType"
              class="w-full"
              :disabled="!form.sourceModule"
              placeholder="请先选择来源模块"
              :options="resourceTypeOptions"
              @change="loadResources"
            />
          </div>
          <div class="md:col-span-2">
            <div class="mb-1.5 flex items-center justify-between">
              <label class="text-xs font-medium text-foreground">
                目标资源实体（树形支持多选）
                <span class="text-rose-500">*</span>
              </label>
              <Space :size="8" v-if="resourceTree.length > 0">
                <Button
                  size="small"
                  type="link"
                  class="!p-0 text-xs"
                  @click="selectAllResources"
                >
                  一键全选
                </Button>
                <Button
                  size="small"
                  type="link"
                  class="!p-0 text-xs text-muted-foreground"
                  @click="clearResources"
                >
                  清空
                </Button>
              </Space>
            </div>
            <TreeSelect
              v-model:value="form.resourceIds"
              multiple
              tree-checkable
              :show-checked-strategy="TreeSelect.SHOW_ALL"
              :max-tag-count="3"
              class="w-full"
              :disabled="!form.resourceType || loadingResources"
              :loading="loadingResources"
              :tree-data="resourceTree"
              :field-names="{
                label: 'label',
                value: 'id',
                children: 'children',
              }"
              show-search
              tree-node-filter-prop="label"
              tree-default-expand-all
              placeholder="可从资源树中多选要验证的具体资源实体（勾选父节点将一并验证所有父子实体）"
            />
          </div>
        </div>
      </section>

      <section class="grid gap-6 px-6 py-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <div class="flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary"
            >
              03
            </span>
            <h3 class="font-semibold text-foreground text-sm">决策请求</h3>
          </div>
          <p class="mt-1.5 pl-8 text-xs text-muted-foreground">
            选择请求操作动作与访问用途（必选），均支持一键全选。
          </p>
        </div>
        <div class="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <label class="text-xs font-medium text-foreground">
                请求动作（支持多选） <span class="text-rose-500">*</span>
              </label>
              <Space :size="8" v-if="actionOptions.length > 0">
                <Button
                  size="small"
                  type="link"
                  class="!p-0 text-xs"
                  @click="selectAllActions"
                >
                  全选
                </Button>
                <Button
                  size="small"
                  type="link"
                  class="!p-0 text-xs text-muted-foreground"
                  @click="clearActions"
                >
                  清空
                </Button>
              </Space>
            </div>
            <Select
              v-model:value="form.actions"
              mode="multiple"
              class="w-full"
              :disabled="!form.resourceType"
              placeholder="请选择要测试的操作动作"
              :options="actionOptions"
            />
          </div>

          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <label class="text-xs font-medium text-foreground">
                访问用途（必选，支持多选） <span class="text-rose-500">*</span>
              </label>
              <Space :size="8" v-if="purposeOptions.length > 0">
                <Button
                  size="small"
                  type="link"
                  class="!p-0 text-xs"
                  @click="selectAllPurposes"
                >
                  全选
                </Button>
                <Button
                  size="small"
                  type="link"
                  class="!p-0 text-xs text-muted-foreground"
                  @click="clearPurposes"
                >
                  清空
                </Button>
              </Space>
            </div>
            <Select
              v-model:value="form.purposes"
              mode="multiple"
              class="w-full"
              :disabled="!form.resourceType"
              allow-clear
              placeholder="留空时自动推导资源所有可用用途"
              :options="purposeOptions"
            />
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
