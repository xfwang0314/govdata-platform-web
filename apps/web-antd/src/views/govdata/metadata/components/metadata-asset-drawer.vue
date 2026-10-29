<script setup lang="ts">
import type { ID } from '#/api/common';
import type {
  MetadataAssetView,
  MetadataImpactView,
  MetadataOptionsView,
} from '#/api/govdata/metadata/model';
import type { DeptTree } from '#/api/system/user/model';

import { nextTick, ref, watch } from 'vue';

import {
  Alert,
  Button,
  Drawer,
  Empty,
  Pagination,
  Spin,
  Table,
  TabPane,
  Tabs,
} from 'antdv-next';

import { getDataSourceApi } from '#/api/govdata/datasource';
import {
  getMetadataAssetApi,
  getMetadataImpactPageApi,
} from '#/api/govdata/metadata';
import { getDeptTree } from '#/api/system/user';

import MetadataAssetHeader from './metadata-asset-header.vue';
import MetadataAssetOverview from './metadata-asset-overview.vue';
import MetadataColumnTable from './metadata-column-table.vue';

const props = defineProps<{ options?: MetadataOptionsView }>();
const openState = ref(false);
const loading = ref(false);
const failed = ref(false);
const asset = ref<MetadataAssetView>();
const selectedColumnId = ref<ID>();
const columnTable = ref<InstanceType<typeof MetadataColumnTable>>();
const impacts = ref<MetadataImpactView[]>([]);
const impactFailed = ref(false);
const impactsLoading = ref(false);
const impactsLoaded = ref(false);
const impactPage = ref(1);
const impactPageSize = ref(20);
const impactTotal = ref(0);
const activeTab = ref('overview');
let impactVersion = 0;
const ownerDeptName = ref('');
const datasourceName = ref('');
let requestVersion = 0;
let lastAssetId: ID | undefined;
const impactColumns = [
  { dataIndex: 'consumerName', title: '下游对象', width: 220 },
  { dataIndex: 'sourceModule', title: '来源模块', width: 150 },
  { dataIndex: 'consumerType', title: '对象类型', width: 130 },
  { dataIndex: 'dependencyType', title: '依赖类型', width: 130 },
  { dataIndex: 'consumerStatus', title: '状态', width: 100 },
];

async function open(row: Pick<MetadataAssetView, 'assetId'>, columnId?: ID) {
  const version = ++requestVersion;
  lastAssetId = row.assetId;
  selectedColumnId.value = columnId;
  asset.value = undefined;
  impacts.value = [];
  impactVersion += 1;
  impactsLoaded.value = false;
  impactsLoading.value = false;
  impactPage.value = 1;
  impactTotal.value = 0;
  activeTab.value = columnId === undefined ? 'overview' : 'columns';
  ownerDeptName.value = '';
  datasourceName.value = '';
  failed.value = false;
  impactFailed.value = false;
  openState.value = true;
  loading.value = true;
  try {
    const assetDetail = await getMetadataAssetApi(row.assetId);
    if (version !== requestVersion) return;
    asset.value = assetDetail;
    const [resolvedDatasourceName, resolvedOwnerDeptName] = await Promise.all([
      resolveDatasourceName(assetDetail.datasourceId),
      resolveDepartmentName(assetDetail.ownerDeptId),
    ]);
    if (version !== requestVersion) return;
    datasourceName.value = resolvedDatasourceName;
    ownerDeptName.value = resolvedOwnerDeptName;
  } catch {
    if (version === requestVersion) failed.value = true;
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}

function retry() {
  if (lastAssetId !== undefined)
    void open({ assetId: lastAssetId }, selectedColumnId.value);
}

function findDepartmentName(
  departments: DeptTree[],
  deptId: number | string,
): string | undefined {
  for (const department of departments) {
    if (String(department.id) === String(deptId)) return department.label;
    const childName = department.children
      ? findDepartmentName(department.children, deptId)
      : undefined;
    if (childName) return childName;
  }
}

async function resolveDepartmentName(deptId?: number | string) {
  if (deptId === undefined || deptId === null) return '未指定';
  try {
    const departments = await getDeptTree();
    return findDepartmentName(departments, deptId) ?? '未找到对应部门';
  } catch {
    return '部门信息暂不可用';
  }
}

async function resolveDatasourceName(datasourceId?: number | string) {
  if (datasourceId === undefined || datasourceId === null) return '未指定';
  try {
    const datasource = await getDataSourceApi(datasourceId);
    return datasource.datasourceName;
  } catch {
    return '数据源信息暂不可用';
  }
}

async function loadImpacts() {
  if (!asset.value) return;
  const id = asset.value.assetId;
  const version = ++impactVersion;
  impactsLoading.value = true;
  impactFailed.value = false;
  try {
    const page = await getMetadataImpactPageApi(id, {
      pageNum: impactPage.value,
      pageSize: impactPageSize.value,
    });
    if (version !== impactVersion) return;
    impacts.value = page.rows;
    impactTotal.value = page.total;
    impactsLoaded.value = true;
  } catch {
    if (version === impactVersion) impactFailed.value = true;
  } finally {
    if (version === impactVersion) impactsLoading.value = false;
  }
}
function changeImpactPage(page: number, size: number) {
  impactPage.value = size === impactPageSize.value ? page : 1;
  impactPageSize.value = size;
  void loadImpacts();
}
watch([activeTab, asset], async () => {
  if (
    activeTab.value === 'impacts' &&
    asset.value &&
    !impactsLoaded.value &&
    !impactsLoading.value
  )
    void loadImpacts();
  if (activeTab.value === 'columns') {
    await nextTick();
    void columnTable.value?.focusSelected();
  }
});
defineExpose({ open });
</script>

<template>
  <Drawer
    v-model:open="openState"
    title="完整详情"
    :size="1060"
    @after-open-change="
      (open) => {
        if (open && activeTab === 'columns') columnTable?.focusSelected();
      }
    "
  >
    <div v-if="asset" class="gov-console-detail space-y-4">
      <MetadataAssetHeader :asset="asset" />
      <Tabs v-model:active-key="activeTab">
        <TabPane key="overview" tab="概览">
          <Spin :spinning="loading">
            <MetadataAssetOverview
              :asset="asset"
              :datasource-name="datasourceName"
              :owner-dept-name="ownerDeptName"
              :options="props.options"
            />
          </Spin>
        </TabPane>
        <TabPane key="columns" :tab="`字段结构（${asset.columns.length}）`">
          <MetadataColumnTable
            ref="columnTable"
            :columns="asset.columns"
            :selected-column-id="selectedColumnId"
          />
        </TabPane>
        <TabPane key="impacts" tab="下游影响">
          <section class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <span class="text-sm text-muted-foreground">已登记 {{ impactTotal }} 项下游依赖</span><Button
                size="small"
                :loading="impactsLoading"
                @click="loadImpacts"
              >
                刷新
              </Button>
            </div>
            <Alert
              v-if="impactFailed"
              type="error"
              show-icon
              message="下游影响关系加载失败"
            >
              <template #action>
                <Button size="small" @click="loadImpacts"> 重试 </Button>
              </template>
            </Alert>
            <Table
              :columns="impactColumns"
              :data-source="impacts"
              :loading="impactsLoading"
              :pagination="false"
              row-key="impactProjectionId"
              size="small"
              :scroll="{ x: 760, y: 400 }"
              :locale="{ emptyText: '暂无已登记的下游依赖' }"
              class="gov-console-table"
            />
            <Pagination
              :current="impactPage"
              :page-size="impactPageSize"
              :total="impactTotal"
              show-size-changer
              size="small"
              @change="changeImpactPage"
            />
          </section>
        </TabPane>
      </Tabs>
    </div>
    <div
      v-else
      class="flex min-h-[420px] flex-col items-center justify-center gap-3"
    >
      <Spin v-if="loading" /><Empty
        v-else
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
        :description="failed ? '详情加载失败' : '未选择资产'"
      /><Button v-if="failed" @click="retry">重新加载</Button>
    </div>
  </Drawer>
</template>
