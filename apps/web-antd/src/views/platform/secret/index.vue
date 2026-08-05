<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type {
  SecretOption,
  SecretOwnerModuleOption,
  SecretView,
} from '#/api/platform/secret/model';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Button, Popover, Space, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  disableSecretApi,
  enableSecretApi,
  getSecretOptionsApi,
  getSecretPageApi,
} from '#/api/platform/secret';
import { ApiSwitch } from '#/components/global';

import SecretCreateModal from './components/secret-create-modal.vue';
import SecretDetailDrawer from './components/secret-detail-drawer.vue';
import SecretEditModal from './components/secret-edit-modal.vue';
import SecretRotateModal from './components/secret-rotate-modal.vue';
import { columns, querySchema } from './data';

const typeOptions = ref<SecretOption[]>([]);
const statusOptions = ref<SecretOption[]>([]);
const ownerModules = ref<SecretOwnerModuleOption[]>([]);
const { hasAccessByCodes } = useAccess();
const canQuerySecret = computed(() =>
  hasAccessByCodes(['platform:secret:query']),
);

const formOptions: VbenFormProps = {
  commonConfig: {
    componentProps: { allowClear: true },
    labelWidth: 82,
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

const gridOptions: VxeGridProps = {
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return getSecretPageApi({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: { keyField: 'secretId' },
  showOverflow: false,
};

const [Grid, tableApi] = useVbenVxeGrid({ formOptions, gridOptions });
const [CreateModal, createModalApi] = useVbenModal({
  connectedComponent: SecretCreateModal,
});
const [EditModal, editModalApi] = useVbenModal({
  connectedComponent: SecretEditModal,
});
const [RotateModal, rotateModalApi] = useVbenModal({
  connectedComponent: SecretRotateModal,
});
const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: SecretDetailDrawer,
});

onMounted(async () => {
  const options = await getSecretOptionsApi();
  typeOptions.value = options.secretTypes;
  statusOptions.value = options.statuses;
  ownerModules.value = options.ownerModules;
  tableApi.formApi.updateSchema(
    querySchema(typeOptions.value, statusOptions.value, ownerModules.value),
  );
});

function typeLabel(code: string) {
  return typeOptions.value.find((item) => item.value === code)?.label ?? code;
}

function ownerModuleLabel(code: string) {
  return ownerModules.value.find((item) => item.value === code)?.label ?? code;
}

function purposeLabels(row: SecretView) {
  const purposes = ownerModules.value.find(
    (item) => item.value === row.ownerModule,
  )?.purposes;
  return row.purposeScope.split(',').map((code) => ({
    code,
    label: purposes?.find((item) => item.value === code)?.label ?? code,
  }));
}

function isExpired(expireTime?: null | string) {
  if (!expireTime) return false;
  return new Date(expireTime.replace(' ', 'T')).getTime() < Date.now();
}

function handleAdd() {
  createModalApi.open();
}

function handleDetail(row: SecretView) {
  if (!canQuerySecret.value) return;
  detailDrawerApi.setData({ record: row, secretId: row.secretId });
  detailDrawerApi.open();
}

function handleEdit(row: SecretView) {
  editModalApi
    .setData({
      record: row,
      secretId: canQuerySecret.value ? row.secretId : undefined,
    })
    .open();
}

function handleRotate(row: SecretView) {
  rotateModalApi
    .setData({
      record: row,
      secretId: canQuerySecret.value ? row.secretId : undefined,
    })
    .open();
}

async function handleStatusChange(enabled: boolean, row: SecretView) {
  await (enabled
    ? enableSecretApi(row.secretId)
    : disableSecretApi(row.secretId));
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="凭据列表">
      <template #toolbar-tools>
        <Space>
          <a-button
            v-access:code="['platform:secret:add']"
            type="primary"
            @click="handleAdd"
          >
            <template #icon>
              <span class="iconify mdi--key-plus-outline"></span>
            </template>
            新建凭据
          </a-button>
        </Space>
      </template>

      <template #secretName="{ row }">
        <div class="min-w-0 py-1">
          <button
            v-if="canQuerySecret"
            class="block max-w-full truncate text-left text-sm font-semibold text-slate-800 hover:text-teal-600 dark:text-slate-100"
            type="button"
            @click="handleDetail(row)"
          >
            {{ row.secretName }}
          </button>
          <span
            v-else
            class="block max-w-full truncate text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            {{ row.secretName }}
          </span>
          <div
            v-if="row.description"
            :title="row.description"
            class="mt-1 max-w-full truncate text-xs text-slate-400"
          >
            {{ row.description }}
          </div>
          <div v-else class="mt-1 text-xs text-slate-300">暂无描述</div>
        </div>
      </template>

      <template #secretType="{ row }">
        <Tag color="cyan">{{ typeLabel(row.secretType) }}</Tag>
      </template>

      <template #ownerModule="{ row }">
        <span
          class="inline-block whitespace-nowrap rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {{ ownerModuleLabel(row.ownerModule) }}
        </span>
      </template>

      <template #purposeScope="{ row }">
        <div class="flex min-w-0 items-center gap-1 py-1">
          <Tag
            v-if="purposeLabels(row)[0]"
            :key="purposeLabels(row)[0]?.code"
            class="m-0 max-w-[150px] truncate"
            color="blue"
          >
            {{ purposeLabels(row)[0]?.label }}
          </Tag>
          <Popover
            v-if="purposeLabels(row).length > 1"
            placement="bottomLeft"
            trigger="click"
          >
            <template #content>
              <div class="flex max-w-[360px] flex-col gap-2 py-1">
                <div
                  v-for="purpose in purposeLabels(row)"
                  :key="purpose.code"
                  class="flex items-center gap-2"
                >
                  <Tag class="m-0" color="blue">{{ purpose.label }}</Tag>
                  <span class="font-mono text-xs text-slate-400">
                    {{ purpose.code }}
                  </span>
                </div>
              </div>
            </template>
            <Button size="small" type="link" @click.stop>
              查看全部（{{ purposeLabels(row).length }}）
            </Button>
          </Popover>
        </div>
      </template>

      <template #version="{ row }">
        <span class="font-mono text-xs font-semibold">
          v{{ row.currentVersionNo }}
        </span>
      </template>

      <template #status="{ row }">
        <ApiSwitch
          :api="(enabled) => handleStatusChange(Boolean(enabled), row)"
          :disabled="!hasAccessByCodes(['platform:secret:edit'])"
          :value="row.status === 'ACTIVE'"
          @reload="tableApi.reload()"
        />
      </template>

      <template #expireTime="{ row }">
        <div v-if="row.expireTime" class="flex items-center gap-2">
          <span>{{ row.expireTime }}</span>
          <Tag v-if="isExpired(row.expireTime)" color="error"> 已过期 </Tag>
        </div>
        <span v-else class="text-slate-400">长期有效</span>
      </template>

      <template #action="{ row }">
        <Space :size="4">
          <action-button
            v-access:code="['platform:secret:query']"
            @click.stop="handleDetail(row)"
          >
            详情
          </action-button>
          <action-button
            v-access:code="['platform:secret:edit']"
            @click.stop="handleEdit(row)"
          >
            编辑
          </action-button>
          <action-button
            v-access:code="['platform:secret:rotate']"
            @click.stop="handleRotate(row)"
          >
            轮换
          </action-button>
        </Space>
      </template>
    </Grid>

    <CreateModal @success="tableApi.reload()" />
    <EditModal @success="tableApi.reload()" />
    <RotateModal @success="tableApi.reload()" />
    <DetailDrawer />
  </Page>
</template>
