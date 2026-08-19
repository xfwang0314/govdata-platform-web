<script setup lang="ts">
import type { DataSourceView } from '#/api/govdata/datasource/model';

import { computed, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import DatasourceModal from './components/datasource-modal.vue';
import DatasourceSummaryCard from './components/datasource-summary-card.vue';
import DatasourceTable from './components/datasource-table.vue';
import MetadataModal from './components/metadata-modal.vue';
import TestHistoryModal from './components/test-history-modal.vue';

const tableRef = ref<InstanceType<typeof DatasourceTable>>();

const [DatasourceModalComponent, datasourceModalApi] = useVbenModal({
  connectedComponent: DatasourceModal,
});
const [HistoryModal, historyModalApi] = useVbenModal({
  connectedComponent: TestHistoryModal,
});
const [MetadataModalComponent, metadataModalApi] = useVbenModal({
  connectedComponent: MetadataModal,
});

const connectorLabels = ref<Record<string, string>>({});
const connectorCategories = ref<string[]>([]);

const connectorCount = computed(
  () => Object.keys(connectorLabels.value).length,
);
const connectorCategoryCount = computed(
  () => new Set(connectorCategories.value).size,
);

function handleLoaded(payload: {
  connectorCategories: string[];
  connectorLabels: Record<string, string>;
}) {
  connectorLabels.value = payload.connectorLabels;
  connectorCategories.value = payload.connectorCategories;
}

function handleAdd() {
  datasourceModalApi.setData({});
  datasourceModalApi.open();
}

function handleEdit(row: DataSourceView) {
  datasourceModalApi.setData({ id: row.datasourceId });
  datasourceModalApi.open();
}

function handleViewHistory(row: DataSourceView) {
  historyModalApi.setData({ id: row.datasourceId });
  historyModalApi.open();
}

function handleViewMetadata(row: DataSourceView) {
  metadataModalApi.setData({
    id: row.datasourceId,
    name: row.datasourceName,
  });
  metadataModalApi.open();
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full min-h-0 flex-col gap-3">
      <!-- 统计指标概览组件 -->
      <DatasourceSummaryCard
        :connector-categories-count="connectorCategoryCount"
        :connector-count="connectorCount"
      />

      <!-- 数据源列表与业务操作组件 -->
      <DatasourceTable
        ref="tableRef"
        @add="handleAdd"
        @edit="handleEdit"
        @loaded="handleLoaded"
        @view-history="handleViewHistory"
        @view-metadata="handleViewMetadata"
      />
    </div>

    <!-- 弹窗组件群 -->
    <DatasourceModalComponent @success="tableRef?.reload()" />
    <HistoryModal />
    <MetadataModalComponent />
  </Page>
</template>
