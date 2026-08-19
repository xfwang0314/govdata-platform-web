<script setup lang="ts">
import type { ID } from '#/api/common';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'antdv-next';

import GrantModal from './components/grant-modal.vue';
import GrantTable from './components/grant-table.vue';

const editor = ref<InstanceType<typeof GrantModal>>();
const tableRef = ref<InstanceType<typeof GrantTable>>();
const activeTab = ref<'active' | 'deleted'>('active');
const deleted = computed(() => activeTab.value === 'deleted');

function handleCreate() {
  editor.value?.open();
}

function handleDetail(grantId: ID) {
  editor.value?.open(grantId, true);
}

function handleEdit(grantId: ID) {
  editor.value?.open(grantId, false);
}

function reloadTable() {
  tableRef.value?.reload();
}
</script>

<template>
  <Page :auto-content-height="true">
    <div class="grant-shell">
      <Tabs v-model:active-key="activeTab" class="grant-tabs">
        <TabPane key="active" tab="生效中授权" />
        <TabPane key="deleted" tab="已删除授权" />
      </Tabs>

      <GrantTable
        ref="tableRef"
        class="flex-1 min-h-0 flex flex-col"
        :deleted="deleted"
        @create="handleCreate"
        @detail="handleDetail"
        @edit="handleEdit"
      />
    </div>

    <GrantModal ref="editor" @success="reloadTable" />
  </Page>
</template>

<style scoped>
.grant-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: hsl(var(--card));
  border-radius: 10px;
}

.grant-tabs {
  flex-shrink: 0;
  padding: 0 18px;
  border-bottom: 1px solid hsl(var(--border));
}
</style>
