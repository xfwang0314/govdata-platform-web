<script setup lang="ts">
import type { ID } from '#/api/common';
import type {
  AuthzOptionsView,
  GrantDraftCommand,
  OptionItem,
  ResourceTreeNode,
} from '#/api/platform/auth/model';
import type { Role } from '#/api/system/role/model';
import type { DeptTree, User } from '#/api/system/user/model';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Drawer,
  Form,
  FormItem,
  message,
  Select,
  Switch,
  TreeSelect,
} from 'antdv-next';
import dayjs from 'dayjs';

import {
  createGrantDraftApi,
  getAuthzOptionsApi,
  getGrantApi,
  getResourceTreeApi,
  updateGrantDraftApi,
} from '#/api/platform/auth';
import { roleList } from '#/api/system/role';
import { getDeptTree, userList } from '#/api/system/user';

import { buildPolicyResourceTypeTree } from '../../policy/policy-resource-type-options';

const emit = defineEmits<{ success: [] }>();
const openState = ref(false);
const submitting = ref(false);
const isReadonly = ref(false);
const editingGrantId = ref<ID>();
const editingGrantCode = ref<string>();
const options = ref<AuthzOptionsView | null>(null);
const resources = ref<ResourceTreeNode[]>([]);
const departmentTree = ref<SubjectDepartmentOption[]>([]);
const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const subjectLoading = ref(false);
const subjectReferencesLoaded = ref(false);

interface SubjectDepartmentOption {
  children?: SubjectDepartmentOption[];
  label: string;
  value: string;
}

const form = reactive({
  actionCodes: [] as string[],
  effectiveTime: dayjs(),
  expireTime: undefined as ReturnType<typeof dayjs> | undefined,
  granteeId: '',
  granteeType: 'DEPARTMENT' as 'ANY' | 'DEPARTMENT' | 'HUMAN' | 'ROLE',
  includeChildren: false,
  purpose: undefined as string | undefined,
  resourceIds: [] as ID[],
  sourceModule: undefined as string | undefined,
  resourceType: undefined as string | undefined,
});
const selectedType = computed(() =>
  options.value?.resourceTypes.find(
    (item) => item.typeCode === form.resourceType,
  ),
);
const purposeOptions = computed(() => selectedType.value?.purposes ?? []);
const grantResourceTypeTree = computed(() =>
  buildPolicyResourceTypeTree(options.value?.resourceTypes ?? [], 'GRANT'),
);
const subjectOptions = computed<OptionItem[]>(() => {
  if (form.granteeType === 'HUMAN') {
    return users.value.map((item) => ({
      label: `${item.nickName}（${item.userName}）`,
      value: String(item.userId),
    }));
  }
  if (form.granteeType === 'ROLE') {
    return roles.value.map((item) => ({
      label: `${item.roleName}（${item.roleKey}）`,
      value: String(item.roleId),
    }));
  }
  return [];
});
const granteeTypeOptions = computed(
  () =>
    options.value?.subjectTypes.filter((item) =>
      ['DEPARTMENT', 'HUMAN', 'ROLE'].includes(item.value),
    ) ?? [],
);

function toDepartmentOptions(
  nodes: DeptTree[],
  parentPath = '',
): SubjectDepartmentOption[] {
  return nodes.map((node) => {
    const label = parentPath ? `${parentPath} / ${node.label}` : node.label;
    return {
      children: toDepartmentOptions(node.children ?? [], label),
      label,
      value: String(node.id),
    };
  });
}

async function loadSubjectReferences() {
  if (subjectReferencesLoaded.value) return;
  subjectLoading.value = true;
  try {
    const [departments, userPage, rolePage] = await Promise.all([
      getDeptTree(),
      userList({ pageNum: 1, pageSize: 500, status: '0' }),
      roleList({ pageNum: 1, pageSize: 500, status: '0' }),
    ]);
    departmentTree.value = toDepartmentOptions(departments);
    users.value = [...userPage.rows];
    roles.value = [...rolePage.rows];
    subjectReferencesLoaded.value = true;
  } finally {
    subjectLoading.value = false;
  }
}

async function open(grantId?: ID, readonly = false) {
  editingGrantId.value = grantId;
  editingGrantCode.value = undefined;
  isReadonly.value = readonly;
  Object.assign(form, {
    actionCodes: [],
    effectiveTime: dayjs(),
    expireTime: undefined,
    granteeId: '',
    granteeType: 'DEPARTMENT',
    includeChildren: false,
    purpose: undefined,
    resourceIds: [],
    sourceModule: undefined,
    resourceType: undefined,
  });
  resources.value = [];
  const [authzOptions] = await Promise.all([
    getAuthzOptionsApi(),
    loadSubjectReferences(),
  ]);
  options.value = authzOptions;

  if (grantId) {
    const detail = await getGrantApi(grantId);
    editingGrantCode.value = detail.grantCode;
    form.granteeType = detail.granteeType as any;
    form.granteeId = detail.granteeId;
    form.purpose = detail.purpose;
    form.effectiveTime = dayjs(detail.effectiveTime);
    form.expireTime = detail.expireTime ? dayjs(detail.expireTime) : undefined;

    // 如果有 scopes，反推 module, type, resources, actions
    if (detail.scopes && detail.scopes.length > 0) {
      const firstScope = detail.scopes[0];
      if (firstScope) {
        form.includeChildren = Boolean(firstScope.includeChildren);
      }
      const matchedType = options.value?.resourceTypes.find((t) =>
        t.purposes?.some((p) => p.value === detail.purpose),
      );
      if (matchedType) {
        form.sourceModule = matchedType.sourceModule;
        form.resourceType = matchedType.typeCode;
        const result = await getResourceTreeApi(matchedType.typeCode);
        resources.value = [...result];
      }
      form.resourceIds = [...new Set(detail.scopes.map((s) => s.resourceId))];
      form.actionCodes = [...new Set(detail.scopes.map((s) => s.actionCode))];
    }
  }

  openState.value = true;
}

function handleSubjectTypeChange() {
  form.granteeId = '';
}

async function handleResourceTypeChange() {
  form.resourceIds = [];
  form.actionCodes = [];
  form.purpose = undefined;
  resources.value = [];
  if (!form.resourceType) return;
  const match = options.value?.resourceTypes.find(
    (item) => item.typeCode === form.resourceType,
  );
  form.sourceModule = match?.sourceModule;
  const result = await getResourceTreeApi(form.resourceType);
  resources.value = [...result];
}
async function submit() {
  const normalizedResourceIds: ID[] = form.resourceIds.map((item: any) =>
    typeof item === 'object' && item !== null && 'value' in item
      ? item.value
      : item,
  );
  if (
    !form.granteeId.trim() ||
    !form.purpose ||
    normalizedResourceIds.length === 0 ||
    form.actionCodes.length === 0
  ) {
    message.warning('请完整填写授权主体、用途、资源和动作');
    return;
  }
  const scopes = normalizedResourceIds.flatMap((resourceId) =>
    form.actionCodes.map((actionCode) => ({
      actionCode,
      includeChildren: form.includeChildren,
      resourceId,
    })),
  );
  const command: GrantDraftCommand = {
    effectiveTime: form.effectiveTime.format('YYYY-MM-DD HH:mm:ss'),
    expireTime: form.expireTime?.format('YYYY-MM-DD HH:mm:ss'),
    granteeId: form.granteeId.trim(),
    granteeType: form.granteeType,
    purpose: form.purpose,
    scopes,
  };
  submitting.value = true;
  try {
    if (editingGrantId.value) {
      await updateGrantDraftApi(editingGrantId.value, command);
      message.success('共享授权草稿已更新');
    } else {
      await createGrantDraftApi(command);
      message.success('共享授权草稿已创建');
    }
    openState.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}
defineExpose({ open });
</script>

<template>
  <Drawer
    v-model:open="openState"
    :title="
      isReadonly
        ? `共享授权凭证详情 · ${editingGrantCode || editingGrantId}`
        : editingGrantId
          ? `编辑共享授权草稿 · ${editingGrantCode || editingGrantId}`
          : '新建共享授权'
    "
    width="min(1120px, 96vw)"
  >
    <Form layout="vertical">
      <div
        class="mb-4 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3"
      >
        <div class="text-sm font-medium text-foreground">
          按共享授权顺序配置
        </div>
        <div class="mt-1 text-xs leading-5 text-muted-foreground">
          依次选择接收授权的主体、共享资源与动作，并设置授权有效期。
        </div>
      </div>

      <div class="space-y-4">
        <section class="overflow-hidden rounded-lg border bg-card">
          <div class="grid lg:grid-cols-[190px_minmax(0,1fr)]">
            <header
              class="border-b bg-muted/30 px-5 py-4 lg:border-b-0 lg:border-r"
            >
              <div class="flex items-center gap-3">
                <span class="grant-step">01</span>
                <h3 class="font-medium">授权对象与用途</h3>
              </div>
              <p class="mt-3 text-xs leading-5 text-muted-foreground">
                每条授权只绑定一个主体。多人共享请先使用角色归组，组织范围使用部门。
              </p>
            </header>
            <div class="grid grid-cols-1 gap-x-5 px-5 pt-5 md:grid-cols-2">
              <FormItem label="被授权主体类型" required>
                <Select
                  v-model:value="form.granteeType"
                  :options="granteeTypeOptions"
                  @change="handleSubjectTypeChange"
                />
              </FormItem>
              <FormItem label="被授权主体" required>
                <TreeSelect
                  v-if="form.granteeType === 'DEPARTMENT'"
                  v-model:value="form.granteeId"
                  :loading="subjectLoading"
                  :tree-data="departmentTree"
                  placeholder="请选择部门"
                  show-search
                  tree-default-expand-all
                  tree-node-filter-prop="label"
                />
                <Select
                  v-else
                  v-model:value="form.granteeId"
                  :loading="subjectLoading"
                  :options="subjectOptions"
                  :placeholder="
                    form.granteeType === 'HUMAN' ? '请选择用户' : '请选择角色'
                  "
                  option-filter-prop="label"
                  show-search
                />
              </FormItem>
            </div>
          </div>
        </section>

        <section class="overflow-hidden rounded-lg border bg-card">
          <div class="grid lg:grid-cols-[190px_minmax(0,1fr)]">
            <header
              class="border-b bg-muted/30 px-5 py-4 lg:border-b-0 lg:border-r"
            >
              <div class="flex items-center gap-3">
                <span class="grant-step">02</span>
                <h3 class="font-medium">共享资源范围</h3>
              </div>
              <p class="mt-3 text-xs leading-5 text-muted-foreground">
                先按来源模块定位资源类型，再选择具体资源、动作和后代范围。
              </p>
            </header>
            <div class="grid grid-cols-1 gap-x-5 px-5 pt-5 md:grid-cols-2">
              <FormItem class="md:col-span-2" label="资源类型" required>
                <TreeSelect
                  v-model:value="form.resourceType"
                  :tree-data="grantResourceTypeTree"
                  placeholder="请选择资源类型"
                  show-search
                  tree-default-expand-all
                  tree-node-filter-prop="label"
                  @change="handleResourceTypeChange"
                />
              </FormItem>
              <FormItem label="授权动作" required>
                <Select
                  v-model:value="form.actionCodes"
                  :disabled="!form.resourceType"
                  :options="selectedType?.actions"
                  mode="multiple"
                  placeholder="请选择允许执行的动作（支持多选）"
                />
              </FormItem>
              <FormItem label="授权用途" required>
                <Select
                  v-model:value="form.purpose"
                  :disabled="!form.resourceType"
                  :options="purposeOptions"
                  placeholder="请选择该资源类型允许的用途"
                />
              </FormItem>
              <FormItem class="md:col-span-2" label="授权资源" required>
                <TreeSelect
                  v-model:value="form.resourceIds"
                  :disabled="!form.resourceType"
                  :field-names="{
                    label: 'label',
                    value: 'id',
                    children: 'children',
                  }"
                  :show-checked-strategy="TreeSelect.SHOW_ALL"
                  :tree-data="resources"
                  allow-clear
                  multiple
                  tree-check-strictly
                  placeholder="请选择具体授权资源（支持跨层级任意多选）"
                  show-search
                  tree-checkable
                  tree-default-expand-all
                  tree-node-filter-prop="label"
                />
              </FormItem>
              <FormItem label="后代资源范围">
                <div class="flex min-h-8 items-center">
                  <Switch v-model:checked="form.includeChildren" />
                  <span class="ml-2 text-xs text-muted-foreground">
                    同时包含该资源的下级资源
                  </span>
                </div>
              </FormItem>
            </div>
          </div>
        </section>

        <section class="overflow-hidden rounded-lg border bg-card">
          <div class="grid lg:grid-cols-[190px_minmax(0,1fr)]">
            <header
              class="border-b bg-muted/30 px-5 py-4 lg:border-b-0 lg:border-r"
            >
              <div class="flex items-center gap-3">
                <span class="grant-step">03</span>
                <h3 class="font-medium">授权有效期</h3>
              </div>
              <p class="mt-3 text-xs leading-5 text-muted-foreground">
                建议按业务审批期限设置失效时间；留空表示长期有效。
              </p>
            </header>
            <div class="grid grid-cols-1 gap-x-5 px-5 pt-5 md:grid-cols-2">
              <FormItem label="生效时间" required>
                <DatePicker
                  v-model:value="form.effectiveTime"
                  show-time
                  class="w-full"
                />
              </FormItem>
              <FormItem label="失效时间">
                <DatePicker
                  v-model:value="form.expireTime"
                  show-time
                  class="w-full"
                  placeholder="不填表示长期有效"
                />
              </FormItem>
            </div>
          </div>
        </section>
      </div>
    </Form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="openState = false">
          {{ isReadonly ? '关闭' : '取消' }}
        </Button>
        <Button
          v-if="!isReadonly"
          :loading="submitting"
          type="primary"
          @click="submit"
        >
          {{ editingGrantId ? '保存修改' : '创建草稿' }}
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.grant-step {
  @apply flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary;
}
</style>
