<script setup lang="ts">
import type { PolicyGroupView } from '#/api/platform/auth/model';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'antdv-next';

import PolicyDrawer from './components/policy-drawer.vue';
import PolicyLogDrawer from './components/policy-log-drawer.vue';
import PolicyTable from './components/policy-table.vue';

const editor = ref<InstanceType<typeof PolicyDrawer>>();
const logDrawer = ref<InstanceType<typeof PolicyLogDrawer>>();
const activeTable = ref<InstanceType<typeof PolicyTable>>();
const activeTab = ref<'active' | 'deleted'>('active');
const deleted = computed(() => activeTab.value === 'deleted');

function handleCreate() {
  editor.value?.open();
}

function handleDetail(code: string) {
  editor.value?.open(code, true);
}

function handleEdit(code: string) {
  editor.value?.open(code, false);
}

function handleLog(row: PolicyGroupView) {
  logDrawer.value?.open(row);
}

function reloadTable() {
  activeTable.value?.reload();
}
</script>

<template>
  <Page :auto-content-height="true">
    <div class="policy-shell">
      <Tabs v-model:active-key="activeTab" class="policy-tabs">
        <TabPane key="active" tab="策略列表" />
        <TabPane key="deleted" tab="已删除策略" />
      </Tabs>

      <PolicyTable
        ref="activeTable"
        class="flex-1 min-h-0 flex flex-col"
        :deleted="deleted"
        @create="handleCreate"
        @detail="handleDetail"
        @edit="handleEdit"
        @log="handleLog"
      />
    </div>

    <PolicyDrawer ref="editor" @success="reloadTable" />
    <PolicyLogDrawer ref="logDrawer" />
  </Page>
</template>

<style scoped>
.policy-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: hsl(var(--card));
  border-radius: 10px;
}

.policy-tabs {
  flex-shrink: 0;
  padding: 0 18px;
  border-bottom: 1px solid hsl(var(--border));
}
</style>
