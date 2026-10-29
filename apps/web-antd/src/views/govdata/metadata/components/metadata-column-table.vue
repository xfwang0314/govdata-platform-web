<script setup lang="ts">
import type { ColumnDisplay } from '../column-data';

import type { ID } from '#/api/common';

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { SearchOutlined } from '@antdv-next/icons';
import { Button, Input, Table } from 'antdv-next';

import { columnColumns, columnType, filterColumns } from '../column-data';

const props = defineProps<{
  columns: ColumnDisplay[];
  selectedColumnId?: ID;
}>();
const keyword = ref('');
const container = ref<HTMLElement>();
const table = ref<{ scrollTo: (config: { key: ID }) => void }>();
let focusFrame = 0;
async function focusSelected() {
  await nextTick();
  cancelAnimationFrame(focusFrame);
  focusFrame = requestAnimationFrame(() => {
    if (props.selectedColumnId === undefined) return;
    table.value?.scrollTo({ key: props.selectedColumnId });
    container.value
      ?.querySelector('[data-selected-column="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  });
}
onBeforeUnmount(() => cancelAnimationFrame(focusFrame));
const filteredColumns = computed(() =>
  filterColumns(props.columns, keyword.value),
);
const selectedColumn = computed(() =>
  props.columns.find(
    (column) => String(column.assetId) === String(props.selectedColumnId),
  ),
);
function selected(column: ColumnDisplay) {
  return String(column.assetId) === String(props.selectedColumnId);
}
watch(
  [() => props.selectedColumnId, () => props.columns, container],
  async () => {
    keyword.value = '';
    await focusSelected();
  },
  { flush: 'post' },
);
watch(keyword, (value) => {
  if (!value.trim()) void focusSelected();
});
defineExpose({ focusSelected });
</script>

<template>
  <section
    ref="container"
    class="metadata-column-table space-y-3"
    aria-label="字段结构字典"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <h4>字段结构</h4>
        <span class="text-xs text-muted-foreground">{{ filteredColumns.length }} / {{ columns.length }}</span>
      </div>
      <Input
        v-model:value="keyword"
        allow-clear
        placeholder="搜索列名、类型或说明"
        aria-label="搜索字段"
        class="w-60 max-w-full"
      >
        <template #prefix><SearchOutlined /></template>
      </Input>
    </div>
    <div v-if="selectedColumn" class="text-xs text-primary" role="status">
      已定位字段：{{ selectedColumn.originalName }}
      <Button size="small" type="link" @click="focusSelected">定位字段</Button>
    </div>
    <Table
      ref="table"
      :columns="columnColumns"
      :data-source="filteredColumns"
      :pagination="false"
      row-key="assetId"
      :row-class-name="
        (record: ColumnDisplay) =>
          selected(record) ? 'metadata-column-row-selected' : ''
      "
      :locale="{ emptyText: keyword ? '没有匹配字段' : '暂无字段信息' }"
      size="small"
      :scroll="{ x: 820, y: 380 }"
      class="gov-console-table"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'originalName'">
          <span :data-selected-column="selected(record)" class="break-all">{{
            record.originalName
          }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'displayName'">
          {{ record.displayName || '—' }}
        </template>
        <template v-else-if="column.dataIndex === 'dataType'">
          {{ columnType(record) }}
        </template>
        <template v-else-if="column.dataIndex === 'constraints'">
          <span v-if="record.primaryKeyFlag" class="mr-2">主键</span>{{
            record.nullableFlag === true
              ? '可空'
              : record.nullableFlag === false
                ? '非空'
                : '未提供'
          }}
        </template>
        <template v-else-if="column.dataIndex === 'commentText'">
          {{ record.commentText || '—' }}
        </template>
      </template>
    </Table>
  </section>
</template>

<style scoped>
.metadata-column-table :deep(.metadata-column-row-selected > td) {
  background: hsl(var(--primary) / 8%);
}

.metadata-column-table :deep(.metadata-column-row-selected > td:first-child) {
  box-shadow: inset 2px 0 hsl(var(--primary));
}
</style>
