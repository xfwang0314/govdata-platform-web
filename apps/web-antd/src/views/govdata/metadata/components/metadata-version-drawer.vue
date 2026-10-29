<script setup lang="ts">
import type { RevisionDifference } from '../revision-diff';

import type { ID } from '#/api/common';
import type {
  MetadataAssetView,
  MetadataChangeIssueView,
  MetadataTableRevisionView,
} from '#/api/govdata/metadata/model';

import { computed, ref, watch } from 'vue';

import { useAccess } from '@vben/access';

import {
  Alert,
  Button,
  Collapse,
  CollapsePanel,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Empty,
  message,
  Pagination,
  Select,
  Spin,
  Table,
  TabPane,
  Tabs,
  Tag,
} from 'antdv-next';

import {
  getMetadataChangeIssuePageApi,
  getMetadataOptionsApi,
  getMetadataRevisionApi,
  getMetadataRevisionPageApi,
  updateMetadataChangeIssueStatusApi,
} from '#/api/govdata/metadata';

import {
  compareRevisionColumns,
  revisionDisplayColumns,
  summaryText,
} from '../revision-diff';
import { useMetadataHistory } from '../use-metadata-history';
import MetadataAssetHeader from './metadata-asset-header.vue';
import MetadataColumnTable from './metadata-column-table.vue';
import MetadataRevisionComparison from './metadata-revision-comparison.vue';

type TableAsset = Pick<
  MetadataAssetView,
  'assetCode' | 'assetId' | 'displayName' | 'originalName'
>;
const { hasAccessByCodes } = useAccess();
const canReadIssues = computed(() =>
  hasAccessByCodes(['govdata:metadata:change-issue:list']),
);
const canReadRevision = computed(() =>
  hasAccessByCodes(['govdata:metadata:revision:query']),
);
const state = useMetadataHistory({
  revisions: (id, pageNum, pageSize) =>
    getMetadataRevisionPageApi(id, { pageNum, pageSize }),
  issues: (id, pageNum, pageSize) =>
    getMetadataChangeIssuePageApi(id, { pageNum, pageSize }),
  options: getMetadataOptionsApi,
});
const {
  revisions,
  issues,
  revisionPage,
  revisionPageSize,
  revisionTotal,
  issuePage,
  issuePageSize,
  issueTotal,
  revisionLoading,
  issueLoading,
  issueLoaded,
  revisionFailed,
  issueFailed,
  optionsFailed,
  options,
} = state;
const activeTab = ref('revisions');
const openState = ref(false);
const tableAsset = ref<TableAsset>();
const selectedRevisionKeys = ref<(number | string)[]>([]);
const selectedRevisions = ref<MetadataTableRevisionView[]>([]);
const comparisonFailed = ref(false);
const comparisonLoading = ref(false);
const comparisonOpen = ref(false);
const comparisonTitle = ref('');
const comparisonRows = ref<RevisionDifference[]>([]);
const detailFailed = ref(false);
const detailLoading = ref(false);
const detailOpen = ref(false);
const revisionDetail = ref<MetadataTableRevisionView>();
const requestedRevision = ref<MetadataTableRevisionView>();
const updatingIssueId = ref<ID>();
let comparisonVersion = 0;
let detailVersion = 0;
const revisionColumns = [
  { dataIndex: 'revisionNo', title: '修订版本', width: 110 },
  { dataIndex: 'changeLevel', title: '变更等级', width: 130 },
  { dataIndex: 'summary', title: '变化摘要', width: 270 },
  { dataIndex: 'observedTime', title: '采集时间', width: 175 },
  { dataIndex: 'action', title: '操作', width: 100 },
];
const issueColumns = [
  { dataIndex: 'issueCode', title: '问题编码', width: 185 },
  { dataIndex: 'revision', title: '影响版本', width: 125 },
  { dataIndex: 'summary', title: '变化摘要', width: 230 },
  { dataIndex: 'issueStatus', title: '处置状态', width: 150 },
  { dataIndex: 'detectedTime', title: '发现时间', width: 170 },
];
function label(
  items: undefined | { label: string; value: string }[],
  value: string,
) {
  return items?.find((item) => item.value === value)?.label ?? value;
}
function clearSelection() {
  selectedRevisionKeys.value = [];
  selectedRevisions.value = [];
}
async function open(asset: TableAsset) {
  tableAsset.value = asset;
  openState.value = true;
  activeTab.value = 'revisions';
  clearSelection();
  comparisonOpen.value = false;
  detailOpen.value = false;
  comparisonVersion += 1;
  detailVersion += 1;
  await state.open(asset.assetId);
}
watch(activeTab, () => {
  if (
    activeTab.value === 'issues' &&
    canReadIssues.value &&
    !issueLoaded.value &&
    !issueLoading.value
  )
    void state.loadIssues();
});
async function refresh() {
  await Promise.all([
    activeTab.value === 'issues' ? state.loadIssues() : state.loadRevisions(),
    state.loadOptions(),
  ]);
}
function changeRevisionPage(page: number, size: number) {
  revisionPage.value = size === revisionPageSize.value ? page : 1;
  revisionPageSize.value = size;
  void state.loadRevisions();
}
function changeIssuePage(page: number, size: number) {
  issuePage.value = size === issuePageSize.value ? page : 1;
  issuePageSize.value = size;
  void state.loadIssues();
}
function handleRevisionSelection(
  keys: (number | string)[],
  rows: MetadataTableRevisionView[],
) {
  if (keys.length > 2) {
    message.warning('一次最多选择两个版本');
    return;
  }
  const known = new Map(
    [...selectedRevisions.value, ...rows, ...revisions.value].map((row) => [
      String(row.tableRevisionId),
      row,
    ]),
  );
  selectedRevisionKeys.value = keys;
  selectedRevisions.value = keys.flatMap((key) => {
    const row = known.get(String(key));
    return row ? [row] : [];
  });
}
const rowSelection = computed(() =>
  canReadRevision.value
    ? {
        selectedRowKeys: selectedRevisionKeys.value,
        preserveSelectedRowKeys: true,
        hideSelectAll: true,
        onChange: handleRevisionSelection,
        getCheckboxProps: (record: MetadataTableRevisionView) => ({
          disabled:
            selectedRevisionKeys.value.length >= 2 &&
            !selectedRevisionKeys.value.some(
              (id) => String(id) === String(record.tableRevisionId),
            ),
        }),
      }
    : undefined,
);
async function compareSelectedVersions() {
  if (
    !tableAsset.value ||
    selectedRevisions.value.length !== 2 ||
    !canReadRevision.value
  )
    return;
  const [before, after] = selectedRevisions.value.toSorted(
    (a, b) => a.revisionNo - b.revisionNo,
  );
  if (!before || !after) return;
  const id = tableAsset.value.assetId;
  const version = ++comparisonVersion;
  comparisonOpen.value = true;
  comparisonLoading.value = true;
  comparisonFailed.value = false;
  comparisonRows.value = [];
  comparisonTitle.value = `${tableAsset.value.displayName || tableAsset.value.originalName} · v${before.revisionNo} → v${after.revisionNo}`;
  try {
    const [oldVersion, newVersion] = await Promise.all([
      getMetadataRevisionApi(id, before.tableRevisionId),
      getMetadataRevisionApi(id, after.tableRevisionId),
    ]);
    if (version === comparisonVersion)
      comparisonRows.value = compareRevisionColumns(
        oldVersion.columns,
        newVersion.columns,
      );
  } catch {
    if (version === comparisonVersion) comparisonFailed.value = true;
  } finally {
    if (version === comparisonVersion) comparisonLoading.value = false;
  }
}
async function showRevision(row: MetadataTableRevisionView) {
  if (!tableAsset.value || !canReadRevision.value) return;
  const id = tableAsset.value.assetId;
  const version = ++detailVersion;
  requestedRevision.value = row;
  detailOpen.value = true;
  detailLoading.value = true;
  detailFailed.value = false;
  revisionDetail.value = undefined;
  try {
    const detail = await getMetadataRevisionApi(id, row.tableRevisionId);
    if (version === detailVersion) revisionDetail.value = detail;
  } catch {
    if (version === detailVersion) detailFailed.value = true;
  } finally {
    if (version === detailVersion) detailLoading.value = false;
  }
}
async function updateStatus(issue: MetadataChangeIssueView, status: string) {
  if (
    status === issue.issueStatus ||
    !hasAccessByCodes(['govdata:metadata:change-issue:manage'])
  )
    return;
  const id = tableAsset.value?.assetId;
  updatingIssueId.value = issue.changeIssueId;
  try {
    await updateMetadataChangeIssueStatusApi(issue.changeIssueId, status);
    message.success('变更问题状态已更新');
    if (String(id) === String(tableAsset.value?.assetId))
      await state.loadIssues();
  } catch {
    message.error('更新失败，请重试');
  } finally {
    updatingIssueId.value = undefined;
  }
}
defineExpose({ open });
</script>

<template>
  <Drawer v-model:open="openState" title="查看版本" :size="1080">
    <template #extra>
      <Button :loading="revisionLoading || issueLoading" @click="refresh">
        刷新
      </Button>
    </template>
    <div v-if="tableAsset" class="space-y-4">
      <MetadataAssetHeader :asset="tableAsset" caption="修订与变更记录" />
      <Alert
        v-if="optionsFailed"
        type="warning"
        show-icon
        message="选项加载失败，可刷新重试"
      />
      <Tabs v-model:active-key="activeTab">
        <TabPane key="revisions" :tab="`修订历史（${revisionTotal}）`">
          <section class="space-y-3">
            <div v-if="canReadRevision" class="metadata-version-selection">
              <span class="min-w-0 flex-1 text-sm text-muted-foreground">{{
                selectedRevisions.length > 0
                  ? `已选 ${selectedRevisions.map((row) => `v${row.revisionNo}`).join('、')}`
                  : '选择两个版本进行字段比对，可跨页选择'
              }}</span><Button
                v-if="selectedRevisions.length > 0"
                size="small"
                @click="clearSelection"
              >
                清空选择
</Button><Button
                type="primary"
                :disabled="selectedRevisions.length !== 2"
                @click="compareSelectedVersions"
              >
                版本比对
              </Button>
            </div>
            <Alert
              v-if="revisionFailed"
              type="error"
              show-icon
              message="修订记录加载失败"
            >
              <template #action>
                <Button size="small" @click="state.loadRevisions">
                  重试
                </Button>
              </template>
            </Alert>
            <Table
              v-else
              :columns="revisionColumns"
              :data-source="revisions"
              :loading="revisionLoading"
              :pagination="false"
              :row-selection="rowSelection"
              row-key="tableRevisionId"
              :scroll="{ x: 820, y: 420 }"
              :locale="{ emptyText: '暂无自动修订记录' }"
              size="small"
              class="gov-console-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'revisionNo'">
                  <strong>v{{ record.revisionNo }}</strong>
</template><template v-else-if="column.dataIndex === 'changeLevel'">
                  <Tag
                    :color="
                      record.changeLevel === 'BREAKING' ? 'error' : undefined
                    "
                  >
                    {{ label(options?.changeLevels, record.changeLevel) }}
                  </Tag>
</template><template v-else-if="column.dataIndex === 'summary'">
                  <span>{{
                    summaryText(record.changeSummaryJson)
                  }}</span>
</template><template v-else-if="column.dataIndex === 'observedTime'">
                  {{ record.observedTime?.replace('T', ' ') }}
</template><template v-else-if="column.dataIndex === 'action'">
                  <Button
                    v-if="canReadRevision"
                    type="link"
                    size="small"
                    @click="showRevision(record)"
                  >
                    查看结构
                  </Button>
                </template>
              </template>
            </Table>
            <Pagination
              :current="revisionPage"
              :page-size="revisionPageSize"
              :total="revisionTotal"
              :page-size-options="['10', '20', '50']"
              show-size-changer
              size="small"
              @change="changeRevisionPage"
            />
          </section>
        </TabPane>
        <TabPane
          v-if="canReadIssues"
          key="issues"
          :tab="`变更问题${issueLoaded ? `（${issueTotal}）` : ''}`"
        >
          <section class="space-y-3">
            <Alert
              v-if="issueFailed"
              type="error"
              show-icon
              message="变更问题加载失败"
            >
              <template #action>
                <Button size="small" @click="state.loadIssues"> 重试 </Button>
              </template>
            </Alert>
            <Table
              v-else
              :columns="issueColumns"
              :data-source="issues"
              :loading="issueLoading"
              :pagination="false"
              row-key="changeIssueId"
              :scroll="{ x: 860, y: 420 }"
              :locale="{ emptyText: '暂无变更问题' }"
              size="small"
              class="gov-console-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'revision'">
                  v{{ record.fromRevisionNo ?? '—' }} → v{{
                    record.toRevisionNo
                  }}
</template><template v-else-if="column.dataIndex === 'summary'">
                  {{ summaryText(record.changeSummaryJson) }}
</template><template v-else-if="column.dataIndex === 'issueStatus'">
                  <Select
                    v-if="
                      hasAccessByCodes([
                        'govdata:metadata:change-issue:manage',
                      ]) && options?.changeIssueStatuses.length
                    "
                    :value="record.issueStatus"
                    :options="options.changeIssueStatuses"
                    :loading="
                      String(updatingIssueId) === String(record.changeIssueId)
                    "
                    :disabled="updatingIssueId !== undefined"
                    class="w-32"
                    @change="(value) => updateStatus(record, String(value))"
                  /><span v-else>{{
                    label(options?.changeIssueStatuses, record.issueStatus)
                  }}</span>
</template><template v-else-if="column.dataIndex === 'detectedTime'">
                  {{ record.detectedTime?.replace('T', ' ') }}
                </template>
              </template>
            </Table>
            <Pagination
              :current="issuePage"
              :page-size="issuePageSize"
              :total="issueTotal"
              :page-size-options="['10', '20', '50']"
              show-size-changer
              size="small"
              @change="changeIssuePage"
            />
          </section>
        </TabPane>
      </Tabs>
    </div>
    <Empty
      v-else
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
      description="未选择数据表"
    />
  </Drawer>
  <Drawer v-model:open="detailOpen" title="修订结构" :size="1020">
    <Alert
      v-if="detailFailed"
      type="error"
      show-icon
      message="修订结构加载失败"
    >
      <template #action>
        <Button
          v-if="requestedRevision"
          size="small"
          @click="showRevision(requestedRevision)"
        >
          重试
        </Button>
      </template>
    </Alert>
    <Spin v-else :spinning="detailLoading">
      <section v-if="revisionDetail && tableAsset" class="space-y-4">
        <MetadataAssetHeader
          :asset="tableAsset"
          :caption="`修订 v${revisionDetail.revisionNo}`"
        /><Descriptions
          :column="{ xs: 1, sm: 1, md: 2 }"
          size="small"
          :colon="false"
        >
          <DescriptionsItem label="上一版本">
            {{
              revisionDetail.previousRevisionNo
                ? `v${revisionDetail.previousRevisionNo}`
                : '首次采集'
            }}
</DescriptionsItem><DescriptionsItem label="观察时间">
            {{
              revisionDetail.observedTime?.replace('T', ' ')
            }}
</DescriptionsItem><DescriptionsItem label="变更等级">
            {{
              label(options?.changeLevels, revisionDetail.changeLevel)
            }}
</DescriptionsItem><DescriptionsItem label="变化摘要">
            {{ summaryText(revisionDetail.changeSummaryJson) }}
          </DescriptionsItem>
</Descriptions><MetadataColumnTable
          :columns="revisionDisplayColumns(revisionDetail.columns)"
        /><Collapse ghost>
          <CollapsePanel key="run" header="执行信息">
            <Descriptions :column="1" size="small">
              <DescriptionsItem label="采集运行ID">
                {{ revisionDetail.harvestRunId }}
</DescriptionsItem><DescriptionsItem label="追踪ID">
                {{ revisionDetail.traceId || '未提供' }}
              </DescriptionsItem>
            </Descriptions>
          </CollapsePanel>
        </Collapse>
      </section>
      <div v-else class="min-h-40"></div>
    </Spin>
  </Drawer>
  <MetadataRevisionComparison
    v-model:open="comparisonOpen"
    :rows="comparisonRows"
    :loading="comparisonLoading"
    :failed="comparisonFailed"
    :title="comparisonTitle"
    @retry="compareSelectedVersions"
  />
</template>
<style scoped>
.metadata-version-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  background: hsl(var(--muted) / 35%);
  border-radius: var(--radius);
}
</style>
