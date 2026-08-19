<script setup lang="ts">
import type {
  SecretOption,
  SecretOwnerModuleOption,
  SecretView,
} from '#/api/platform/secret/model';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import SecretCreateModal from './components/secret-create-modal.vue';
import SecretDetailDrawer from './components/secret-detail-drawer.vue';
import SecretEditModal from './components/secret-edit-modal.vue';
import SecretRotateModal from './components/secret-rotate-modal.vue';
import SecretSummaryCard from './components/secret-summary-card.vue';
import SecretTable from './components/secret-table.vue';

const tableRef = ref<InstanceType<typeof SecretTable>>();
const typeOptions = ref<SecretOption[]>([]);
const ownerModules = ref<SecretOwnerModuleOption[]>([]);
const { hasAccessByCodes } = useAccess();
const canQuerySecret = computed(() =>
  hasAccessByCodes(['platform:secret:query']),
);

const secretTypeCount = computed(() => typeOptions.value.length);
const ownerModuleCount = computed(() => ownerModules.value.length);

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

function handleLoaded(payload: {
  ownerModules: SecretOwnerModuleOption[];
  typeOptions: SecretOption[];
}) {
  typeOptions.value = payload.typeOptions;
  ownerModules.value = payload.ownerModules;
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
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full min-h-0 flex-col gap-3">
      <!-- 统计指标概览组件 -->
      <SecretSummaryCard
        :owner-module-count="ownerModuleCount"
        :secret-type-count="secretTypeCount"
      />

      <!-- 凭据主列表与业务操作组件 -->
      <SecretTable
        ref="tableRef"
        @add="handleAdd"
        @detail="handleDetail"
        @edit="handleEdit"
        @loaded="handleLoaded"
        @rotate="handleRotate"
      />
    </div>

    <!-- 弹窗与抽屉组件群 -->
    <CreateModal @success="tableRef?.reload()" />
    <EditModal @success="tableRef?.reload()" />
    <RotateModal @success="tableRef?.reload()" />
    <DetailDrawer />
  </Page>
</template>
