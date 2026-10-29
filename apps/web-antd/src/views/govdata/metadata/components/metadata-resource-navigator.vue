<script setup lang="ts">
import type { ExplorerDatasource, ExplorerNode } from '../explorer-navigation';

import type { ID } from '#/api/common';
import type { MetadataAssetTreeView } from '#/api/govdata/metadata/model';

import { computed, ref, watch } from 'vue';

import {
  ApartmentOutlined,
  DatabaseOutlined,
  FieldStringOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  SearchOutlined,
  TableOutlined,
  UpOutlined,
} from '@antdv-next/icons';
import { useElementSize } from '@vueuse/core';
import { Button, Input, Spin, Tree } from 'antdv-next';

import {
  assetNodeKey,
  buildExplorerTree,
  categoryNodeKey,
  datasourceNodeKey,
  explorerParentKeys,
  filterExplorerTree,
  findExplorerNode,
} from '../explorer-navigation';

const props = defineProps<{
  datasources: ExplorerDatasource[];
  failedDatasourceIds: string[];
  loadDatasource: (datasourceId: ID) => Promise<void>;
  loading: boolean;
  selectedDatasourceId?: ID;
  selectedNodeId?: ID;
  selectedType?: string;
  trees: Record<string, MetadataAssetTreeView[]>;
}>();

const emit = defineEmits<{
  select: [datasourceId: ID, asset?: MetadataAssetTreeView, type?: string];
}>();

const keyword = ref('');
const treeContainer = ref<HTMLElement>();
const { height: treeHeight } = useElementSize(treeContainer);
const expandedKeys = ref<string[]>(['databases']);
const navigationNodes = computed(() =>
  buildExplorerTree(props.datasources, props.trees, props.failedDatasourceIds),
);
const filteredNodes = computed(() =>
  filterExplorerTree(navigationNodes.value, keyword.value),
);
const visibleExpandedKeys = computed({
  get: () =>
    keyword.value.trim()
      ? explorerParentKeys(filteredNodes.value)
      : expandedKeys.value,
  set: (keys: string[]) => {
    expandedKeys.value = keys;
  },
});
const selectedKeys = computed(() => {
  if (props.selectedType && props.selectedDatasourceId !== undefined) {
    const key = categoryNodeKey(
      props.selectedDatasourceId,
      props.selectedNodeId,
      props.selectedType,
    );
    if (findExplorerNode(navigationNodes.value, key)) return [key];
  }
  if (props.selectedNodeId !== undefined)
    return [assetNodeKey(props.selectedNodeId)];
  return props.selectedDatasourceId === undefined
    ? []
    : [datasourceNodeKey(props.selectedDatasourceId)];
});

watch(
  [
    () => props.selectedDatasourceId,
    () => props.trees[String(props.selectedDatasourceId)],
  ],
  ([id]) => {
    if (id === undefined) return;
    // 更新数组引用，确保树组件同步展开新选中的连接。
    const firstNamespace = props.trees[String(id)]?.find(
      (node) => node.assetType === 'CATALOG' || node.assetType === 'SCHEMA',
    );
    expandedKeys.value = [
      ...new Set([
        ...expandedKeys.value,
        `connector:${props.datasources.find((source) => String(source.datasourceId) === String(id))?.connectorCode}`,
        'databases',
        datasourceNodeKey(id),
        ...(firstNamespace ? [assetNodeKey(firstNamespace.assetId)] : []),
      ]),
    ];
  },
  { immediate: true },
);

function treeNode(node: unknown): ExplorerNode {
  return node as ExplorerNode;
}

async function loadNode(node: unknown) {
  const item = treeNode(node);
  if (item.kind !== 'datasource' || item.datasourceId === undefined) return;
  try {
    await props.loadDatasource(item.datasourceId);
  } catch {
    // 错误保留在对应连接下，通过节点内按钮重试，其他连接仍可浏览。
  }
}

async function retryNode(node: unknown) {
  const item = treeNode(node);
  if (item.datasourceId === undefined) return;
  try {
    await props.loadDatasource(item.datasourceId);
    if (String(props.selectedDatasourceId) === String(item.datasourceId)) {
      emit('select', item.datasourceId);
    }
  } catch {
    // 重试失败仍保留当前连接的错误节点。
  }
}

function handleSelect(keys: Array<number | string>) {
  const node = findExplorerNode(navigationNodes.value, String(keys[0] ?? ''));
  if (node?.datasourceId === undefined || !node.selectable) return;
  emit('select', node.datasourceId, node.asset, node.assetType);
}
</script>

<template>
  <aside class="gov-resource-navigator h-full" aria-label="元数据资源导航">
    <div class="gov-resource-navigator__title justify-between">
      <span>浏览数据资产</span>
      <Button
        type="text"
        size="small"
        aria-label="收起所有层级"
        title="收起所有层级"
        @click="expandedKeys = ['databases']"
      >
        <template #icon><UpOutlined /></template>
      </Button>
    </div>
    <div class="gov-resource-navigator__controls">
      <Input
        v-model:value="keyword"
        allow-clear
        class="gov-console-filter w-full"
        placeholder="搜索连接或命名空间"
        aria-label="搜索资源树"
        :disabled="loading"
      >
        <template #prefix><SearchOutlined /></template>
      </Input>
    </div>
    <div
      ref="treeContainer"
      class="min-h-0 flex-1 overflow-hidden px-2 pb-3 pt-1"
    >
      <Spin :spinning="loading" class="block min-h-40">
        <div
          v-if="!loading && datasources.length === 0"
          class="px-3 py-8 text-center text-xs leading-6 text-muted-foreground"
        >
          暂无可见数据库连接
        </div>
        <div
          v-else-if="!loading && filteredNodes.length === 0"
          class="px-3 py-8 text-center text-xs leading-6 text-muted-foreground"
        >
          未找到匹配资源
        </div>
        <Tree
          v-else
          v-model:expanded-keys="visibleExpandedKeys"
          :auto-expand-parent="Boolean(keyword.trim())"
          :selected-keys="selectedKeys"
          :tree-data="filteredNodes"
          :height="Math.max(160, treeHeight - 16)"
          virtual
          :load-data="loadNode"
          :disabled="loading"
          block-node
          class="gov-resource-tree bg-transparent text-xs"
          @select="handleSelect"
        >
          <template #titleRender="node">
            <Button
              v-if="treeNode(node).kind === 'error'"
              size="small"
              type="link"
              @click.stop="retryNode(node)"
            >
              <template #icon><ReloadOutlined /></template>
              加载失败，重试
            </Button>
            <span v-else class="flex min-w-0 items-center gap-2">
              <ApartmentOutlined
                v-if="treeNode(node).kind === 'database'"
                class="shrink-0"
              />
              <DatabaseOutlined
                v-else-if="
                  treeNode(node).kind === 'datasource' ||
                  treeNode(node).kind === 'connector' ||
                  (treeNode(node).kind === 'asset' &&
                    treeNode(node).asset?.assetType === 'CATALOG')
                "
                class="shrink-0"
              />
              <FolderOpenOutlined
                v-else-if="
                  treeNode(node).kind === 'asset' &&
                  treeNode(node).asset?.assetType === 'SCHEMA'
                "
                class="shrink-0"
              />
              <FieldStringOutlined
                v-else-if="treeNode(node).assetType === 'COLUMN'"
                class="shrink-0 text-muted-foreground"
              />
              <TableOutlined
                v-else-if="treeNode(node).kind === 'category'"
                class="shrink-0"
              />
              <span
                class="block min-w-0 truncate"
                :title="treeNode(node).title"
              >
                {{ treeNode(node).title }}
              </span>
              <span
                v-if="treeNode(node).count !== undefined"
                class="metadata-node-count"
                :title="
                  treeNode(node).kind === 'database'
                    ? '可见连接数'
                    : '当前授权范围内的资产数'
                "
                >{{ treeNode(node).count }}</span>
            </span>
          </template>
        </Tree>
      </Spin>
    </div>
  </aside>
</template>

<style scoped>
.metadata-node-count {
  padding: 0 5px;
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
  border: 1px solid var(--gov-console-divider);
  border-radius: 4px;
}
</style>
