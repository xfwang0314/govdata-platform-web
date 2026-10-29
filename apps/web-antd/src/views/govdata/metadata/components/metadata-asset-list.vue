<script setup lang="ts">
import type { ID } from '#/api/common';
import type {
  MetadataAssetTreeView,
  MetadataAssetView,
  MetadataOptionsView,
} from '#/api/govdata/metadata/model';

import { computed, onMounted, ref, watch } from 'vue';

import {
  AppstoreOutlined,
  FieldStringOutlined,
  SearchOutlined,
  TableOutlined,
  UnorderedListOutlined,
} from '@antdv-next/icons';
import {
  Alert,
  Button,
  Empty,
  Input,
  Pagination,
  Select,
  Spin,
  Table,
} from 'antdv-next';

import { getMetadataAssetPageApi } from '#/api/govdata/metadata';

import { resultColumns } from '../data';
import { findAssetPath } from '../explorer-navigation';
import { useMetadataResults } from '../use-metadata-results';

const props = defineProps<{
  assetType: string;
  datasourceId?: ID;
  datasourceName?: string;
  failed: boolean;
  loading: boolean;
  namespaceAssetId?: ID;
  namespaceNodes: MetadataAssetTreeView[];
  options?: MetadataOptionsView;
  selectedId?: ID;
}>();
const emit = defineEmits<{
  select: [asset?: MetadataAssetView, reveal?: boolean];
  typeChange: [type: string];
}>();
const keyword = ref('');
const status = ref<string>();
const pageNum = ref(1);
const pageSize = ref(15);
const viewMode = ref<'cards' | 'table'>('cards');
const state = useMetadataResults(getMetadataAssetPageApi);
const { rows, total, loading: querying, failed: queryFailed } = state;
const assetTypes = computed(
  () =>
    props.options?.assetTypes.filter(
      (item) => item.value === 'TABLE' || item.value === 'COLUMN',
    ) ?? [],
);
const title = computed(() =>
  props.assetType === 'COLUMN' ? '列资产' : '表与视图',
);
const busy = computed(() => props.loading || querying.value);
function location(row: MetadataAssetView) {
  const path = findAssetPath(props.namespaceNodes, row.assetId).slice(0, -1);
  return [
    props.datasourceName,
    ...path.map((item) => item.displayName || item.originalName),
  ]
    .filter(Boolean)
    .join(' / ');
}
function label(
  items: undefined | { label: string; value: string }[],
  value: string,
) {
  return items?.find((item) => item.value === value)?.label ?? value;
}
async function load(reset = false) {
  if (reset) pageNum.value = 1;
  const ok = await state.load(
    props.datasourceId === undefined || props.loading || props.failed
      ? undefined
      : {
          datasourceId: props.datasourceId,
          namespaceAssetId: props.namespaceAssetId,
          assetType: props.assetType,
          pageNum: pageNum.value,
          pageSize: pageSize.value,
          keyword: keyword.value || undefined,
          technicalStatus: status.value,
        },
  );
  if (ok)
    emit(
      'select',
      rows.value.find(
        (row) => String(row.assetId) === String(props.selectedId),
      ) ?? rows.value[0],
      false,
    );
  else if (queryFailed.value) emit('select', undefined, false);
}
function reset() {
  keyword.value = '';
  status.value = undefined;
  void load(true);
}
function changePage(page: number, size: number) {
  pageNum.value = size === pageSize.value ? page : 1;
  pageSize.value = size;
  void load();
}
watch(
  [
    () => props.assetType,
    () => props.datasourceId,
    () => props.namespaceAssetId,
    () => props.loading,
    () => props.failed,
  ],
  () => {
    void load(true);
  },
);
onMounted(() => {
  void load();
});
</script>

<template>
  <section class="metadata-results" aria-label="资产搜索结果">
    <form class="metadata-results__query" @submit.prevent="load(true)">
      <Input
        v-model:value="keyword"
        allow-clear
        placeholder="搜索名称或物理名"
        aria-label="搜索资产"
        class="metadata-results__search min-w-0 flex-1"
      >
        <template #prefix><SearchOutlined /></template>
      </Input>
      <Select
        v-model:value="status"
        :options="options?.technicalStatuses"
        allow-clear
        placeholder="全部状态"
        aria-label="技术状态"
        class="w-32"
      />
      <Button html-type="submit" type="primary" :loading="busy">查询</Button><Button @click="reset">重置</Button>
    </form>
    <div class="metadata-results__toolbar">
      <div class="flex min-w-0 items-center gap-2">
        <Button
          v-for="item in assetTypes"
          :key="item.value"
          :type="assetType === item.value ? 'primary' : 'text'"
          size="small"
          @click="emit('typeChange', item.value)"
        >
          {{ item.label }}
        </Button>
        <span class="text-xs text-muted-foreground">{{ total }} 项结果</span>
      </div>
      <div class="flex items-center gap-1">
        <Button
          type="text"
          size="small"
          aria-label="卡片视图"
          :aria-pressed="viewMode === 'cards'"
          @click="viewMode = 'cards'"
        >
          <template #icon><AppstoreOutlined /></template>
        </Button>
        <Button
          type="text"
          size="small"
          aria-label="列表视图"
          :aria-pressed="viewMode === 'table'"
          @click="viewMode = 'table'"
        >
          <template #icon><UnorderedListOutlined /></template>
        </Button>
      </div>
    </div>
    <div class="metadata-results__body">
      <Alert v-if="queryFailed" type="error" show-icon message="资产加载失败">
        <template #action>
          <Button size="small" @click="load()">重试</Button>
        </template>
      </Alert>
      <Spin :spinning="busy" class="block min-h-40">
        <Empty
          v-if="!busy && !queryFailed && rows.length === 0"
          :image="Empty.PRESENTED_IMAGE_SIMPLE"
          :description="
            datasourceId === undefined ? '请选择数据库连接' : '没有匹配资产'
          "
          class="py-12"
        />
        <div v-if="viewMode === 'cards'" class="metadata-results__cards">
          <button
            v-for="row in rows"
            :key="String(row.assetId)"
            type="button"
            class="metadata-result-card"
            :class="{
              'metadata-result-card--selected':
                String(selectedId) === String(row.assetId),
            }"
            :aria-pressed="String(selectedId) === String(row.assetId)"
            @click="emit('select', row, true)"
          >
            <span class="metadata-result-card__path" :title="location(row)">{{
              location(row)
            }}</span>
            <span class="metadata-result-card__title"><FieldStringOutlined
                v-if="row.assetType === 'COLUMN'"
              /><TableOutlined v-else /><span class="truncate">{{
                row.displayName || row.originalName
              }}</span></span>
            <span class="metadata-result-card__description">{{
              row.description || row.commentText || '暂无描述'
            }}</span>
            <span class="metadata-result-card__meta"><span>{{ row.originalName }}</span><span>·</span><span>{{
                label(options?.technicalStatuses, row.technicalStatus)
              }}</span><span v-if="row.assetType !== 'COLUMN' && row.currentRevisionNo">· v{{ row.currentRevisionNo }}</span></span>
          </button>
        </div>
        <Table
          v-else-if="rows.length > 0"
          :columns="resultColumns"
          :data-source="rows"
          :pagination="false"
          row-key="assetId"
          :scroll="{ x: 520 }"
          :row-class-name="
            (row: MetadataAssetView) =>
              String(row.assetId) === String(selectedId)
                ? 'metadata-result-row-selected'
                : ''
          "
          :custom-row="
            (row: MetadataAssetView) => ({
              onClick: () => emit('select', row, true),
              tabindex: 0,
              onKeydown: (event: KeyboardEvent) => {
                if (event.key === 'Enter') emit('select', row, true);
              },
            })
          "
          class="gov-console-table"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'displayName'">
              <button
                type="button"
                class="text-primary"
                @click.stop="emit('select', record, true)"
              >
                {{ record.displayName || record.originalName }}
              </button>
</template><template v-else-if="column.dataIndex === 'technicalStatus'">
              {{ label(options?.technicalStatuses, record.technicalStatus) }}
            </template>
          </template>
        </Table>
      </Spin>
    </div>
    <div class="metadata-results__pagination">
      <span class="shrink-0 text-xs text-muted-foreground">{{ title }}</span><Pagination
        :current="pageNum"
        :page-size="pageSize"
        :total="total"
        :page-size-options="['15', '30', '50', '100']"
        show-size-changer
        size="small"
        @change="changePage"
      />
    </div>
  </section>
</template>

<style scoped>
.metadata-results {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.metadata-results__query {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--gov-console-divider);
}

.metadata-results__search {
  flex-basis: 200px;
  min-width: 160px;
}

.metadata-results__toolbar {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 6px 16px;
}

.metadata-results__body {
  flex: 1;
  min-height: 0;
  padding: 0 16px 12px;
  overflow: auto;
}

.metadata-results__cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metadata-result-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 16px 18px;
  overflow: hidden;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: hsl(var(--card));
  border: 1px solid var(--gov-console-divider);
  border-radius: var(--radius);
  transition: border-color 120ms;
}

.metadata-result-card:hover,
.metadata-result-card--selected {
  border-color: hsl(var(--primary));
}

.metadata-result-card:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: -2px;
}

.metadata-result-card__path {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--gov-console-caption-size);
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.metadata-result-card__title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 16px;
  color: hsl(var(--primary));
}

.metadata-result-card__description {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.metadata-result-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: var(--gov-console-caption-size);
  color: hsl(var(--muted-foreground));
}

.metadata-results__pagination {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid var(--gov-console-divider);
}

.metadata-results :deep(.metadata-result-row-selected > td) {
  background: hsl(var(--primary) / 7%);
}
</style>
