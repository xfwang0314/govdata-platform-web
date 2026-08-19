<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ID } from '#/api/common';
import type { AuthzOptionsView, GrantView } from '#/api/platform/auth/model';
import type { Role } from '#/api/system/role/model';
import type { DeptTree, User } from '#/api/system/user/model';

import { h, onMounted, ref, watch } from 'vue';

import {
  Button,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  activateGrantApi,
  deleteGrantApi,
  getAuthzOptionsApi,
  getGrantPageApi,
  restoreGrantApi,
  revokeGrantApi,
} from '#/api/platform/auth';
import { roleList } from '#/api/system/role';
import { getDeptTree, userList } from '#/api/system/user';

import { columns, querySchema } from '../data';

const props = withDefaults(
  defineProps<{
    deleted?: boolean;
  }>(),
  {
    deleted: false,
  },
);

const emit = defineEmits<{
  create: [];
  detail: [grantId: ID];
  edit: [grantId: ID];
}>();

const options = ref<AuthzOptionsView | null>(null);
const subjectLabels = ref<Record<string, string>>({});

const formOptions: VbenFormProps = {
  commonConfig: {
    componentProps: { allowClear: true },
    labelWidth: 80,
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

const gridOptions: VxeGridProps = {
  cellConfig: { height: 68 },
  columns,
  headerCellConfig: { height: 44 },
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) =>
        await getGrantPageApi({
          ...formValues,
          deleted: props.deleted,
          keyword: formValues.keyword || undefined,
          pageNum: page.currentPage,
          pageSize: page.pageSize,
        }),
    },
  },
  rowConfig: { keyField: 'grantId' },
  id: 'platform-auth-grant-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({ formOptions, gridOptions });

function optionLabel(
  items: Array<{ label: string; value: string }> | undefined,
  value?: string,
) {
  if (!value) return '-';
  return items?.find((item) => item.value === value)?.label ?? value;
}

function collectDepartmentLabels(
  nodes: DeptTree[],
  parentPath = '',
  labels: Record<string, string> = {},
) {
  for (const node of nodes) {
    const fullName = parentPath ? `${parentPath} / ${node.label}` : node.label;
    labels[`DEPARTMENT:${node.id}`] = fullName;
    collectDepartmentLabels(node.children ?? [], fullName, labels);
  }
  return labels;
}

function buildSubjectLabels(
  departments: DeptTree[],
  users: User[],
  roles: Role[],
) {
  const labels = collectDepartmentLabels(departments);
  for (const user of users) {
    const label = `${user.nickName}（${user.userName}）`;
    labels[`HUMAN:${user.userId}`] = label;
    labels[`HUMAN:${String(user.userId)}`] = label;
  }
  for (const role of roles) {
    const label = `${role.roleName}（${role.roleKey}）`;
    labels[`ROLE:${role.roleId}`] = label;
    labels[`ROLE:${String(role.roleId)}`] = label;
    labels[`ROLE:${role.roleKey}`] = label;
  }
  return labels;
}

function subjectLabel(granteeType: string, granteeId: string) {
  const key = `${granteeType}:${granteeId}`;
  return subjectLabels.value[key] ?? granteeId;
}

function statusColor(status: string) {
  switch (status) {
    case 'ACTIVE': {
      return 'success';
    }
    case 'EXPIRED': {
      return 'default';
    }
    case 'PENDING': {
      return 'processing';
    }
    case 'REVOKED': {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

function statusLabel(status: string) {
  return optionLabel(options.value?.grantStatuses, status);
}

function purposeLabel(purposeCode?: string) {
  if (!purposeCode) return '-';
  const allPurposes =
    options.value?.resourceTypes.flatMap((t) => t.purposes ?? []) ?? [];
  return allPurposes.find((p) => p.value === purposeCode)?.label ?? purposeCode;
}

async function activate(row: GrantView) {
  await activateGrantApi(row.grantId);
  message.success('共享授权已激活生效');
  await tableApi.reload();
}

function handleDeleteActive(row: GrantView) {
  let reason = '';
  Modal.confirm({
    title: '删除生效中的共享授权',
    content: () =>
      h('div', { class: 'space-y-2' }, [
        h(
          'p',
          { class: 'text-xs text-amber-600 dark:text-amber-400' },
          '当前授权处于生效状态，删除前将自动执行撤销。',
        ),
        h(Input, {
          'onUpdate:value': (value: string) => {
            reason = value;
          },
          placeholder: '请输入删除/撤销原因',
        }),
      ]),
    async onOk() {
      await deleteGrantApi(row.grantId, reason.trim() || '管理员删除');
      message.success('共享授权已删除并撤销');
      await tableApi.reload();
    },
  });
}

async function handleDeleteInactive(row: GrantView) {
  await deleteGrantApi(row.grantId);
  message.success('共享授权已删除');
  await tableApi.reload();
}

async function handleRestore(row: GrantView) {
  await restoreGrantApi(row.grantId);
  message.success('共享授权已恢复');
  await tableApi.reload();
}

function revoke(row: GrantView) {
  let reason = '';
  Modal.confirm({
    title: '撤销共享授权',
    content: () =>
      h(Input, {
        'onUpdate:value': (value: string) => {
          reason = value;
        },
        placeholder: '请输入撤销原因',
      }),
    async onOk() {
      if (!reason.trim()) {
        message.warning('请输入撤销原因');
        throw new Error('撤销原因不能为空');
      }
      await revokeGrantApi(row.grantId, { reason: reason.trim() });
      message.success('共享授权已撤销');
      await tableApi.reload();
    },
  });
}

interface PurposeTreeNode {
  children?: PurposeTreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
  label: string;
  selectable?: boolean;
  value: string;
}

function buildGrantPurposeTree(
  authzOptions?: AuthzOptionsView | null,
): PurposeTreeNode[] {
  if (!authzOptions) return [];
  const grantTypes = authzOptions.resourceTypes.filter((type) =>
    type.capabilities.includes('GRANT'),
  );
  if (grantTypes.length === 0) return [];

  const moduleMap = new Map<string, typeof grantTypes>();
  for (const type of grantTypes) {
    const list = moduleMap.get(type.sourceModule) ?? [];
    list.push(type);
    moduleMap.set(type.sourceModule, list);
  }

  const moduleLabelMap = new Map(
    authzOptions.resourceModules.map((m) => [m.value, m.label]),
  );

  const tree: PurposeTreeNode[] = [];
  for (const [moduleCode, types] of moduleMap.entries()) {
    const moduleName = moduleLabelMap.get(moduleCode) ?? moduleCode;
    const typeNodes: PurposeTreeNode[] = [];

    for (const type of types) {
      if (!type.purposes || type.purposes.length === 0) continue;
      const purposeChildren: PurposeTreeNode[] = type.purposes.map((p) => ({
        disabled: false,
        isLeaf: true,
        label: p.label,
        selectable: true,
        value: p.value,
      }));

      typeNodes.push({
        children: purposeChildren,
        disabled: true,
        isLeaf: false,
        label: `${type.typeLabel}（${type.typeCode}）`,
        selectable: false,
        value: `type_${type.typeCode}`,
      });
    }

    if (typeNodes.length > 0) {
      tree.push({
        children: typeNodes,
        disabled: true,
        isLeaf: false,
        label: moduleName,
        selectable: false,
        value: `module_${moduleCode}`,
      });
    }
  }

  return tree;
}

function updateFormSchema() {
  if (!options.value) return;
  const granteeTypeOpts = options.value.subjectTypes.filter((item) =>
    ['DEPARTMENT', 'HUMAN', 'ROLE'].includes(item.value),
  );
  tableApi.formApi.updateSchema([
    {
      componentProps: { options: options.value.grantSourceTypes },
      fieldName: 'sourceType',
    },
    {
      componentProps: { options: granteeTypeOpts },
      fieldName: 'granteeType',
    },
    {
      componentProps: {
        treeData: buildGrantPurposeTree(options.value),
      },
      fieldName: 'purpose',
    },
    {
      componentProps: { options: options.value.grantStatuses },
      fieldName: 'status',
    },
  ]);
}

async function loadReferences() {
  const [authzOptions, departments, userPage, rolePage] = await Promise.all([
    getAuthzOptionsApi(),
    getDeptTree(),
    userList({ pageNum: 1, pageSize: 500, status: '0' }),
    roleList({ pageNum: 1, pageSize: 500, status: '0' }),
  ]);
  options.value = authzOptions;
  subjectLabels.value = buildSubjectLabels(
    departments,
    userPage.rows,
    rolePage.rows,
  );
}

async function reload() {
  await tableApi.reload();
}

watch(() => props.deleted, reload);

onMounted(async () => {
  await loadReferences();
  updateFormSchema();
});

defineExpose({ reload });
</script>

<template>
  <BasicTable :table-title="deleted ? '已删除授权列表' : '共享授权列表'">
    <template #toolbar-tools>
      <Button
        v-if="!deleted"
        v-access:code="['platform:auth:grant:add']"
        type="primary"
        @click="emit('create')"
      >
        新建共享授权
      </Button>
    </template>

    <!-- 共享授权凭据 -->
    <template #grant="{ row }">
      <div class="space-y-0.5 text-xs">
        <button
          class="group flex items-center gap-1.5 font-mono font-medium text-foreground hover:text-primary"
          type="button"
          @click="emit('detail', row.grantId)"
        >
          <span class="truncate">{{ row.grantCode }}</span>
        </button>
        <div class="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span class="truncate">来源: {{ row.sourceType }} · {{ row.sourceId }}</span>
        </div>
      </div>
    </template>

    <!-- 被授权主体 -->
    <template #grantee="{ row }">
      <div
        class="flex flex-col items-center justify-center gap-1 text-center text-xs w-full"
      >
        <div class="flex items-center justify-center">
          <Tag
            :color="
              row.granteeType === 'HUMAN'
                ? 'blue'
                : row.granteeType === 'ROLE'
                  ? 'purple'
                  : 'cyan'
            "
            class="px-1 py-0 text-[11px]"
          >
            {{ optionLabel(options?.subjectTypes, row.granteeType) }}
          </Tag>
        </div>
        <div
          class="truncate font-medium text-foreground"
          :title="subjectLabel(row.granteeType, row.granteeId)"
        >
          {{ subjectLabel(row.granteeType, row.granteeId) }}
        </div>
      </div>
    </template>

    <!-- 用途与有效期 -->
    <template #validity="{ row }">
      <div class="flex flex-col items-center gap-0.5 text-xs text-center">
        <div>
          <Tag color="geekblue" class="px-1 py-0 text-[11px]">
            {{ purposeLabel(row.purpose) }}
          </Tag>
        </div>
        <div
          class="text-[11px] text-muted-foreground truncate"
          :title="`${row.effectiveTime} 至 ${row.expireTime ?? '长期有效'}`"
        >
          {{ row.effectiveTime?.slice(0, 10) }} ~
          {{ row.expireTime ? row.expireTime.slice(0, 10) : '长期' }}
        </div>
      </div>
    </template>

    <!-- 状态 -->
    <template #status="{ row }">
      <Tag :color="statusColor(row.status)">
        {{ statusLabel(row.status) }}
      </Tag>
    </template>

    <!-- 操作 -->
    <template #action="{ row }">
      <Space :size="4">
        <Button
          size="small"
          type="link"
          class="!px-1"
          @click="emit('detail', row.grantId)"
        >
          详情
        </Button>
        <template v-if="!deleted">
          <Button
            v-if="row.status === 'DRAFT' || row.status === 'PENDING'"
            v-access:code="[
              'platform:auth:grant:edit',
              'platform:auth:grant:add',
            ]"
            size="small"
            type="link"
            class="!px-1"
            @click="emit('edit', row.grantId)"
          >
            编辑
          </Button>
          <Popconfirm
            v-if="row.status === 'DRAFT' || row.status === 'PENDING'"
            title="激活前会校验当前主体的 AUTHORIZE 权限，确认继续？"
            @confirm="activate(row)"
          >
            <Button
              v-access:code="['platform:auth:grant:activate']"
              size="small"
              type="link"
              class="!px-1 text-emerald-600 dark:text-emerald-400"
            >
              激活
            </Button>
          </Popconfirm>
          <Button
            v-if="row.status === 'ACTIVE'"
            v-access:code="['platform:auth:grant:revoke']"
            size="small"
            type="link"
            danger
            class="!px-1"
            @click="revoke(row)"
          >
            撤销
          </Button>
          <template v-if="row.status === 'ACTIVE'">
            <Button
              v-access:code="['platform:auth:grant:delete']"
              size="small"
              type="link"
              danger
              class="!px-1"
              @click="handleDeleteActive(row)"
            >
              删除
            </Button>
          </template>
          <template v-else>
            <Popconfirm
              title="确认删除该共享授权？"
              @confirm="handleDeleteInactive(row)"
            >
              <Button
                v-access:code="['platform:auth:grant:delete']"
                size="small"
                type="link"
                danger
                class="!px-1"
              >
                删除
              </Button>
            </Popconfirm>
          </template>
        </template>
        <Popconfirm
          v-else
          title="确认恢复该共享授权？"
          @confirm="handleRestore(row)"
        >
          <Button
            v-access:code="['platform:auth:grant:delete']"
            size="small"
            type="link"
            class="!px-1"
          >
            恢复
          </Button>
        </Popconfirm>
      </Space>
    </template>
  </BasicTable>
</template>
