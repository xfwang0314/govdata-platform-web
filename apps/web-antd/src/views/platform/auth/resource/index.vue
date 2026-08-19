<script setup lang="ts">
import type { ResourceNavigationFilter } from './resource-navigation';

import type {
  AuthzOptionsView,
  ResourceDescriptor,
} from '#/api/platform/auth/model';
import type { DeptTree } from '#/api/system/user/model';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { getAuthzOptionsApi } from '#/api/platform/auth';
import { getDeptTree } from '#/api/system/user';

import ResourceDetailDrawer from './components/resource-detail-drawer.vue';
import ResourceDirectorySidebar from './components/resource-directory-sidebar.vue';
import ResourceSummaryCard from './components/resource-summary-card.vue';
import ResourceTable from './components/resource-table.vue';

const optionsLoading = ref(true);
const options = ref<AuthzOptionsView | null>(null);
const tableRef = ref<InstanceType<typeof ResourceTable>>();
const detailDrawer = ref<InstanceType<typeof ResourceDetailDrawer>>();
const sidebar = ref<InstanceType<typeof ResourceDirectorySidebar>>();
const resourceDirectoryOpen = ref(true);
const activeNavigationLabel = ref('全部授权资源');
const navigationFilter = ref<ResourceNavigationFilter>({});
const departmentLabels = ref<Record<string, string>>({});

const sourceModuleCount = computed(
  () => options.value?.resourceModules.length ?? 0,
);
const catalogResourceTypes = computed(
  () =>
    options.value?.resourceTypes.filter((item) =>
      item.capabilities.includes('RESOURCE_CATALOG'),
    ) ?? [],
);

function collectDepartmentLabels(
  nodes: DeptTree[],
  parentPath = '',
  labels: Record<string, string> = {},
) {
  for (const node of nodes) {
    const fullName = parentPath ? `${parentPath} / ${node.label}` : node.label;
    labels[String(node.id)] = fullName;
    collectDepartmentLabels(node.children ?? [], fullName, labels);
  }
  return labels;
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    options.value = await getAuthzOptionsApi();
    if (options.value) {
      tableRef.value?.updateFormSchema(options.value);
    }
  } finally {
    optionsLoading.value = false;
  }
}

async function loadDepartments() {
  departmentLabels.value = collectDepartmentLabels(await getDeptTree());
}

async function handleNavigationReload() {
  activeNavigationLabel.value = '全部授权资源';
  navigationFilter.value = {};
  await loadOptions();
  tableRef.value?.reload();
}

function handleNavigationSelect(
  filter: ResourceNavigationFilter,
  label: string,
) {
  navigationFilter.value = filter;
  activeNavigationLabel.value = label;
  tableRef.value?.submitForm();
}

function handleResetNavigation() {
  sidebar.value?.resetSelection();
  activeNavigationLabel.value = '全部授权资源';
  navigationFilter.value = {};
}

function openDetail(row: ResourceDescriptor) {
  detailDrawer.value?.open(row);
}

onMounted(async () => {
  await Promise.all([loadOptions(), loadDepartments()]);
});
</script>

<template>
  <Page :auto-content-height="true">
    <div class="flex h-full min-h-0 flex-col gap-3">
      <!-- 授权资源台账统计指标概览组件 -->
      <ResourceSummaryCard
        :catalog-resource-type-count="catalogResourceTypes.length"
        :source-module-count="sourceModuleCount"
      />

      <div class="flex min-h-0 flex-1 gap-3">
        <!-- 资源目录树组件 -->
        <ResourceDirectorySidebar
          v-if="resourceDirectoryOpen"
          ref="sidebar"
          :loading="optionsLoading"
          :options="options"
          @collapse="resourceDirectoryOpen = false"
          @reload="handleNavigationReload"
          @select="handleNavigationSelect"
        />

        <!-- 资源主表格/树表组件 -->
        <ResourceTable
          ref="tableRef"
          :active-navigation-label="activeNavigationLabel"
          :department-labels="departmentLabels"
          :navigation-filter="navigationFilter"
          :options="options"
          :resource-directory-open="resourceDirectoryOpen"
          @open-directory="resourceDirectoryOpen = true"
          @reset-navigation="handleResetNavigation"
          @view-detail="openDetail"
        />
      </div>
    </div>

    <!-- 资源详情与验证抽屉组件 -->
    <ResourceDetailDrawer
      ref="detailDrawer"
      :department-labels="departmentLabels"
      :options="options"
    />
  </Page>
</template>
