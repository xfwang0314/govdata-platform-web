<script setup lang="ts">
import type { DataSourceView } from '#/api/govdata/datasource/model';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import DatasourceModal from './components/datasource-modal.vue';
import DatasourceSummaryCard from './components/datasource-summary-card.vue';
import DatasourceTable from './components/datasource-table.vue';
import MetadataModal from './components/metadata-modal.vue';
import TestHistoryModal from './components/test-history-modal.vue';

interface DatasourceSummary {
  connectorCategoriesCount: number;
  connectorCount: number;
}

const tableRef = ref<InstanceType<typeof DatasourceTable>>();
const datasourceSummary = ref<DatasourceSummary>({
  connectorCategoriesCount: 0,
  connectorCount: 0,
});

const [DatasourceModalComponent, datasourceModalApi] = useVbenModal({
  connectedComponent: DatasourceModal,
});
const [HistoryModal, historyModalApi] = useVbenModal({
  connectedComponent: TestHistoryModal,
});
const [MetadataModalComponent, metadataModalApi] = useVbenModal({
  connectedComponent: MetadataModal,
});

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

function handleSummaryChange(summary: DatasourceSummary) {
  datasourceSummary.value = summary;
}
</script>

<template>
  <Page
    auto-content-height
    class="gov-console-page"
    content-class="gov-console-page-content"
  >
    <div class="flex h-full min-h-0 flex-col gap-3">
      <DatasourceSummaryCard
        :connector-categories-count="datasourceSummary.connectorCategoriesCount"
        :connector-count="datasourceSummary.connectorCount"
      />
      <DatasourceTable
        ref="tableRef"
        @add="handleAdd"
        @edit="handleEdit"
        @summary-change="handleSummaryChange"
        @view-history="handleViewHistory"
        @view-metadata="handleViewMetadata"
      />
    </div>

    <DatasourceModalComponent @success="tableRef?.reload()" />
    <HistoryModal />
    <MetadataModalComponent />
  </Page>
</template>
