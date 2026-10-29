<script setup lang="ts">
import type { TreeProps } from 'antdv-next';
import type { Key } from 'antdv-next/dist/table/interface';

import type { AuthzOptionsView } from '#/api/platform/auth/model';

import { computed, ref, watch } from 'vue';

import {
  FolderOpenOutlined,
  MenuFoldOutlined,
  SyncOutlined,
} from '@antdv-next/icons';
import { Button, Empty, Input, Skeleton, Tree } from 'antdv-next';

import {
  getResourceDirectoryChildrenApi,
  getResourceDirectoryRootsApi,
} from '#/api/platform/auth';

import {
  buildLoadedResourceNavigation,
  buildResourceDirectoryNodes,
  buildResourceNavigation,
  filterResourceNavigation,
  resolveResourceNavigationFilter,
} from '../resource-navigation';

const props = defineProps<{
  loading?: boolean;
  options?: AuthzOptionsView | null;
}>();

const emit = defineEmits<{
  (e: 'collapse'): void;
  (e: 'reload'): void;
  (
    e: 'select',
    filter: ReturnType<typeof resolveResourceNavigationFilter>,
    label: string,
  ): void;
}>();

const navigationKeyword = ref('');
const selectedNavigationKeys = ref<Key[]>(['all']);

const catalogResourceTypes = computed(
  () =>
    props.options?.resourceTypes.filter((item) =>
      item.capabilities.includes('RESOURCE_CATALOG'),
    ) ?? [],
);

const visibleResourceCategories = computed(() =>
  (props.options?.resourceCategories ?? []).filter((category) =>
    catalogResourceTypes.value.some(
      (type) => type.categoryCode === category.code,
    ),
  ),
);
const navigationTree = ref<ReturnType<typeof buildResourceNavigation>>([]);
let navigationLoadVersion = 0;

watch(
  visibleResourceCategories,
  async (categories) => {
    const loadVersion = ++navigationLoadVersion;
    const loaded = await buildLoadedResourceNavigation(
      categories,
      getResourceDirectoryRootsApi,
    );
    if (loadVersion === navigationLoadVersion) {
      navigationTree.value = loaded;
    }
  },
  { immediate: true },
);

const filteredNavigationNodes = computed(() =>
  filterResourceNavigation(navigationTree.value, navigationKeyword.value),
);

const filteredNavigationTree = computed(() =>
  filteredNavigationNodes.value.length > 0
    ? [
        {
          children: filteredNavigationNodes.value,
          key: 'all',
          title: '全部授权资源',
        },
      ]
    : [],
);

function computeNavigationLabel(key: string) {
  if (key === 'all') return '全部授权资源';
  if (key.startsWith('resource:')) {
    return findNavigationLabel(navigationTree.value, key) ?? '授权资源';
  }
  if (key.startsWith('module:')) {
    const moduleCode = key.replace('module:', '');
    return (
      props.options?.resourceModules.find((item) => item.value === moduleCode)
        ?.label ?? '来源模块'
    );
  }
  const typeCode = key.replace('type:', '');
  return (
    catalogResourceTypes.value.find((item) => item.typeCode === typeCode)
      ?.typeLabel ?? '资源类型'
  );
}

function findNavigationLabel(
  nodes: ReturnType<typeof buildResourceNavigation>,
  key: string,
): string | undefined {
  for (const node of nodes) {
    if (node.key === key) return node.title;
    const child = findNavigationLabel(node.children ?? [], key);
    if (child) return child;
  }
  return undefined;
}

async function loadNavigationChildren(
  treeNode: Parameters<NonNullable<TreeProps['loadData']>>[0],
) {
  const node = treeNode.dataRef as ReturnType<
    typeof buildResourceNavigation
  >[number];
  if (node.children) return;
  if (node.categoryCode) {
    node.children = buildResourceDirectoryNodes(
      await getResourceDirectoryRootsApi(node.categoryCode),
    );
    return;
  }
  if (node.resourceId) {
    node.children = buildResourceDirectoryNodes(
      await getResourceDirectoryChildrenApi(node.resourceId),
    );
    return;
  }
  node.children = [];
}

function handleNavigationSelect(keys: Key[]) {
  const key = String(keys[0] ?? 'all');
  selectedNavigationKeys.value = [key];
  const filter = resolveResourceNavigationFilter(key);
  const label = computeNavigationLabel(key);
  emit('select', filter, label);
}

function handleReload() {
  navigationKeyword.value = '';
  selectedNavigationKeys.value = ['all'];
  emit('reload');
}

function resetSelection() {
  selectedNavigationKeys.value = ['all'];
  navigationKeyword.value = '';
}

defineExpose({
  resetSelection,
});
</script>

<template>
  <aside class="resource-directory w-[272px] shrink-0">
    <Skeleton :loading="loading" :paragraph="{ rows: 8 }" active class="p-4">
      <div class="flex h-full flex-col overflow-hidden">
        <div class="border-b p-4 pb-3">
          <div class="mb-3 flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2 text-sm font-semibold">
                <FolderOpenOutlined class="text-primary" />
                资源目录
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                按真实资源父子关系定位
              </div>
            </div>
            <div class="flex">
              <Button
                aria-label="刷新资源目录"
                size="small"
                type="text"
                @click="handleReload"
              >
                <template #icon><SyncOutlined /></template>
              </Button>
              <Button
                aria-label="收起资源目录"
                size="small"
                type="text"
                @click="emit('collapse')"
              >
                <template #icon><MenuFoldOutlined /></template>
              </Button>
            </div>
          </div>
          <Input
            v-model:value="navigationKeyword"
            allow-clear
            placeholder="搜索已加载资源"
            size="small"
          />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          <Tree
            v-if="filteredNavigationTree.length > 0"
            v-model:selected-keys="selectedNavigationKeys"
            :show-line="{ showLeafIcon: false }"
            :tree-data="filteredNavigationTree"
            :virtual="false"
            block-node
            default-expand-all
            :load-data="loadNavigationChildren"
            @select="handleNavigationSelect"
          />
          <Empty
            v-else
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
            class="mt-8"
            description="没有匹配的资源类型"
          />
        </div>
        <div class="border-t px-4 py-3 text-xs text-muted-foreground">
          Resource 是领域对象的最小授权投影，业务数据仍由来源模块维护。
        </div>
      </div>
    </Skeleton>
  </aside>
</template>

<style scoped>
.resource-directory {
  height: 100%;
  overflow: hidden;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

@media (max-width: 900px) {
  .resource-directory {
    width: 232px;
  }
}
</style>
