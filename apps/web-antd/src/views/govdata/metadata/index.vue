<script setup lang="ts">
import type { ExplorerDatasource } from './explorer-navigation';

import type { ID } from '#/api/common';
import type {
  MetadataAssetTreeView,
  MetadataAssetView,
} from '#/api/govdata/metadata/model';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import { useMediaQuery } from '@vueuse/core';
import { Alert, Button } from 'antdv-next';

import { getDataSourcePageApi } from '#/api/govdata/datasource';
import {
  getMetadataAssetTreeApi,
  getMetadataOptionsApi,
} from '#/api/govdata/metadata';

import MetadataAssetDrawer from './components/metadata-asset-drawer.vue';
import MetadataAssetList from './components/metadata-asset-list.vue';
import MetadataAssetPreview from './components/metadata-asset-preview.vue';
import MetadataGovernanceModal from './components/metadata-governance-modal.vue';
import MetadataResourceNavigator from './components/metadata-resource-navigator.vue';
import MetadataScopeBar from './components/metadata-scope-bar.vue';
import MetadataVersionDrawer from './components/metadata-version-drawer.vue';
import MetadataWorkspaceLayout from './components/metadata-workspace-layout.vue';
import { useMetadataExplorer } from './use-metadata-explorer';

const drawer = ref<InstanceType<typeof MetadataAssetDrawer>>();
const versionDrawer = ref<InstanceType<typeof MetadataVersionDrawer>>();
const navigationCollapsed = ref(false);
const previewOpen = ref(false);
const previewAsset = ref<MetadataAssetView>();
const resultType = ref('TABLE');
const wide = useMediaQuery('(min-width: 1280px)');
const { hasAccessByCodes } = useAccess();
const canPreview = computed(() => hasAccessByCodes(['govdata:metadata:query']));
const governanceModal = ref<InstanceType<typeof MetadataGovernanceModal>>();
const explorer = useMetadataExplorer({
  loadDatasources,
  loadOptions: () => Promise.resolve(getMetadataOptionsApi()),
  loadTree: getMetadataAssetTreeApi,
});
const {
  breadcrumbs,
  datasources,
  failedDatasourceIds,
  initializationFailed,
  initializing,
  loading,
  loadFailed,
  namespaceAssetId,
  nodes,
  options,
  selectedAssetId,
  selectedDatasourceId,
  trees,
} = explorer;

async function loadDatasources(): Promise<ExplorerDatasource[]> {
  const sources: ExplorerDatasource[] = [];
  let pageNum = 1;
  while (true) {
    const page = await getDataSourcePageApi({ pageNum, pageSize: 100 });
    sources.push(...page.rows);
    if (page.rows.length === 0 || sources.length >= page.total) return sources;
    pageNum += 1;
  }
}

async function select(id?: ID, asset?: MetadataAssetTreeView, type?: string) {
  previewAsset.value = undefined;
  previewOpen.value = false;
  if (type) resultType.value = type;
  await explorer.select(id, asset);
}
function changeType(type: string) {
  resultType.value = type;
  previewAsset.value = undefined;
  previewOpen.value = false;
}
function preview(asset?: MetadataAssetView, reveal = true) {
  const first = previewAsset.value === undefined;
  previewAsset.value = asset;
  if (!asset) previewOpen.value = false;
  else if (reveal || (first && wide.value)) previewOpen.value = true;
}
function openDetail(asset: MetadataAssetView) {
  if (asset.assetType === 'COLUMN' && asset.parentAssetId !== null)
    void drawer.value?.open({ assetId: asset.parentAssetId }, asset.assetId);
  else void drawer.value?.open(asset);
}
async function refresh() {
  await explorer.refresh();
}
const datasourceName = computed(
  () =>
    datasources.value.find(
      (source) =>
        String(source.datasourceId) === String(selectedDatasourceId.value),
    )?.datasourceName,
);

onMounted(explorer.initialize);
</script>

<template>
  <Page
    auto-content-height
    class="gov-console-page gov-metadata-page"
    content-class="gov-console-page-content gov-metadata-page-content"
  >
    <div class="flex h-full min-h-0 flex-col">
      <Alert
        v-if="initializationFailed"
        type="error"
        show-icon
        message="数据源或选项加载失败"
      >
        <template #action>
          <Button size="small" @click="explorer.initialize"> 重试 </Button>
        </template>
      </Alert>
      <MetadataWorkspaceLayout
        v-model:collapsed="navigationCollapsed"
        v-model:preview-open="previewOpen"
        class="min-h-0 flex-1"
      >
        <template #navigator>
          <MetadataResourceNavigator
            :datasources="datasources"
            :loading="initializing"
            :failed-datasource-ids="failedDatasourceIds"
            :load-datasource="explorer.loadDatasource"
            :trees="trees"
            :selected-datasource-id="selectedDatasourceId"
            :selected-node-id="selectedAssetId"
            :selected-type="resultType"
            @select="select"
          />
        </template>
        <MetadataScopeBar
          :collapsed="navigationCollapsed"
          :items="breadcrumbs"
          :loading="loading || initializing"
          @toggle="navigationCollapsed = !navigationCollapsed"
          @select="select"
          @refresh="refresh"
        />
        <Alert
          v-if="loadFailed"
          type="error"
          show-icon
          message="当前数据库目录加载失败"
        >
          <template #action>
            <Button size="small" @click="refresh">重试</Button>
          </template>
        </Alert>
        <MetadataAssetList
          :key="`${selectedDatasourceId ?? 'none'}:${namespaceAssetId ?? 'root'}`"
          :asset-type="resultType"
          :datasource-name="datasourceName"
          :selected-id="previewAsset?.assetId"
          :datasource-id="selectedDatasourceId"
          :failed="loadFailed"
          :loading="loading || initializing"
          :namespace-asset-id="namespaceAssetId"
          :namespace-nodes="nodes"
          :options="options"
          @select="preview"
          @type-change="changeType"
        />
        <template #preview>
          <MetadataAssetPreview
            :asset="previewOpen ? previewAsset : undefined"
            :can-read="canPreview"
            :datasource-name="datasourceName"
            :nodes="nodes"
            :options="options"
            @close="previewOpen = false"
            @detail="openDetail"
            @version="versionDrawer?.open($event)"
            @edit="governanceModal?.open($event)"
          />
        </template>
      </MetadataWorkspaceLayout>
    </div>
    <MetadataAssetDrawer ref="drawer" :options="options" />
    <MetadataVersionDrawer ref="versionDrawer" />
    <MetadataGovernanceModal ref="governanceModal" @saved="refresh" />
  </Page>
</template>
