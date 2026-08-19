<script setup lang="ts">
import type { DecisionLogView } from '#/api/platform/auth/model';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import DecisionDetailDrawer from './components/decision-detail-drawer.vue';
import DecisionLogTable from './components/decision-log-table.vue';

const detailDrawer = ref<InstanceType<typeof DecisionDetailDrawer>>();

function handleDetail(row: DecisionLogView) {
  detailDrawer.value?.open(row);
}
</script>

<template>
  <Page :auto-content-height="true">
    <div class="h-full min-h-0">
      <DecisionLogTable @detail="handleDetail" />
    </div>
    <DecisionDetailDrawer ref="detailDrawer" />
  </Page>
</template>
