<script setup lang="ts">
import type {
  AuthzOptionsView,
  PolicyGroupView,
  PolicyOperationLogView,
  PolicyVersionView,
} from '#/api/platform/auth/model';
import type { Role } from '#/api/system/role/model';
import type { DeptTree, User } from '#/api/system/user/model';

import { ref } from 'vue';

import {
  Drawer,
  Empty,
  Spin,
  TabPane,
  Tabs,
  Tag,
  Timeline,
  TimelineItem,
  Tooltip,
} from 'antdv-next';

import {
  getAuthzOptionsApi,
  getPolicyGroupApi,
  getPolicyGroupOperationsApi,
  getPolicyGroupVersionsApi,
} from '#/api/platform/auth';
import { roleList } from '#/api/system/role';
import { getDeptTree, userList } from '#/api/system/user';

const options = ref<AuthzOptionsView | null>(null);
const visible = ref(false);
const loading = ref(false);
const current = ref<PolicyGroupView>();
const versions = ref<PolicyVersionView[]>([]);
const operations = ref<PolicyOperationLogView[]>([]);
const activeKey = ref<'operations' | 'versions'>('operations');
const subjectLabels = ref<Record<string, string>>({});
let requestSequence = 0;

function optionLabel(
  items: Array<{ label: string; value: string }> | undefined,
  value?: string,
) {
  return items?.find((item) => item.value === value)?.label ?? value ?? '-';
}

function collectDepartmentLabels(
  nodes: DeptTree[],
  parentPath = '',
  labels: Record<string, string> = {},
) {
  for (const node of nodes) {
    const fullName = parentPath ? `${parentPath} / ${node.label}` : node.label;
    labels[`DEPARTMENT:${node.id}`] = fullName;
    collectDepartmentLabels(node.children ?? [], fullName, labels);
  }
  return labels;
}

function buildSubjectLabels(
  departments: DeptTree[],
  users: User[],
  roles: Role[],
) {
  const labels = collectDepartmentLabels(departments);
  for (const user of users) {
    const label = `${user.nickName}（${user.userName}）`;
    labels[`HUMAN:${user.userId}`] = label;
    labels[`HUMAN:${String(user.userId)}`] = label;
  }
  for (const role of roles) {
    const label = `${role.roleName}（${role.roleKey}）`;
    labels[`ROLE:${role.roleId}`] = label;
    labels[`ROLE:${String(role.roleId)}`] = label;
    labels[`ROLE:${role.roleKey}`] = label;
  }
  return labels;
}

function subjectDisplayName(type: string, id: string) {
  if (type === 'ANY' || id === '*') return '所有主体';
  const key = `${type}:${id}`;
  if (subjectLabels.value[key]) {
    return subjectLabels.value[key];
  }
  return id || '-';
}

function versionTag(version: PolicyVersionView) {
  if (version.versionStatus === 'PUBLISHED') {
    if (current.value?.status === 'DISABLED') {
      return {
        color: 'warning',
        label: '已停用（已脱机）',
        tip: '策略组当前处于已停用状态，此版本已退出运行时授权决策',
      };
    }
    return {
      color: 'success',
      label: '已发布（生效中）',
      tip: '当前运行版本，正在参与运行时授权决策',
    };
  }
  if (version.versionStatus === 'DRAFT') {
    return {
      color: 'processing',
      label: '待发布版本',
      tip: '策略组正在编辑的草稿版本，尚未参与授权决策',
    };
  }
  if (version.versionStatus === 'SUPERSEDED') {
    return {
      color: 'default',
      label: '已被替代',
      tip: '历史发布版本，已被后续版本替代',
    };
  }
  return {
    color: 'default',
    label: optionLabel(
      options.value?.policyVersionStatuses,
      version.versionStatus,
    ),
    tip: '',
  };
}

async function open(
  group: PolicyGroupView,
  defaultTab: 'operations' | 'versions' = 'operations',
) {
  const sequence = ++requestSequence;
  visible.value = true;
  loading.value = true;
  activeKey.value = defaultTab;
  try {
    const [
      authzOptions,
      detail,
      history,
      logs,
      departments,
      userPage,
      rolePage,
    ] = await Promise.all([
      getAuthzOptionsApi(),
      getPolicyGroupApi(group.policyGroupCode),
      getPolicyGroupVersionsApi(group.policyGroupCode),
      getPolicyGroupOperationsApi(group.policyGroupCode),
      getDeptTree(),
      userList({ pageNum: 1, pageSize: 500, status: '0' }),
      roleList({ pageNum: 1, pageSize: 500, status: '0' }),
    ]);
    if (sequence !== requestSequence) return;
    options.value = authzOptions;
    current.value = detail;
    versions.value = history;
    operations.value = logs;
    subjectLabels.value = buildSubjectLabels(
      departments,
      userPage.rows,
      rolePage.rows,
    );
  } finally {
    if (sequence === requestSequence) loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Drawer
    v-model:open="visible"
    :destroy-on-close="true"
    :title="
      current ? `日志与版本记录 · ${current.policyName}` : '日志与版本记录'
    "
    width="min(860px, 90vw)"
  >
    <Spin :spinning="loading">
      <template v-if="current">
        <div class="log-hero">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-semibold">{{ current.policyName }}</h2>
              <Tag :color="current.status === 'ACTIVE' ? 'success' : 'default'">
                {{ optionLabel(options?.policyStatuses, current.status) }}
              </Tag>
            </div>
            <code class="text-xs text-muted-foreground mt-1 block">{{
              current.policyGroupCode
            }}</code>
          </div>
          <div class="version-badge">
            <strong class="text-lg">v{{ current.currentVersionNo ?? '-' }}</strong>
            <span class="text-xs text-muted-foreground">当前运行版本</span>
          </div>
        </div>

        <Tabs v-model:active-key="activeKey" class="mt-4">
          <TabPane key="operations" :tab="`操作日志（${operations.length}）`">
            <div v-if="operations.length > 0" class="pt-3 px-1">
              <Timeline>
                <TimelineItem
                  v-for="item in operations"
                  :key="String(item.operationLogId)"
                  :color="
                    item.operationType === 'PUBLISH'
                      ? 'green'
                      : item.operationType === 'DELETE'
                        ? 'red'
                        : item.operationType === 'DISABLE'
                          ? 'orange'
                          : 'blue'
                  "
                >
                  <div class="space-y-1.5 -mt-1">
                    <div
                      class="flex flex-wrap items-center justify-between gap-2"
                    >
                      <div class="flex items-center gap-2">
                        <Tag
                          :color="
                            item.operationType === 'PUBLISH'
                              ? 'success'
                              : item.operationType === 'DELETE'
                                ? 'error'
                                : item.operationType === 'DISABLE'
                                  ? 'warning'
                                  : 'processing'
                          "
                          class="px-2 py-0.5 text-xs font-semibold"
                        >
                          {{ item.operationLabel }}
                        </Tag>
                        <span
                          v-if="item.fromStatus || item.toStatus"
                          class="text-xs text-muted-foreground flex items-center gap-1"
                        >
                          <span v-if="item.fromStatus">
                            {{
                              optionLabel(
                                options?.policyStatuses,
                                item.fromStatus,
                              )
                            }}
                          </span>
                          <span v-if="item.fromStatus && item.toStatus">→</span>
                          <span
                            v-if="item.toStatus"
                            class="font-medium text-foreground"
                          >
                            {{
                              optionLabel(
                                options?.policyStatuses,
                                item.toStatus,
                              )
                            }}
                          </span>
                        </span>
                      </div>
                      <span class="text-xs text-muted-foreground font-mono">
                        {{ item.occurredTime }}
                      </span>
                    </div>

                    <div
                      v-if="item.operationReason"
                      class="text-xs text-foreground bg-muted/30 border rounded-md px-3 py-1.5"
                    >
                      <span class="text-muted-foreground mr-1">原因:</span>
                      {{ item.operationReason }}
                    </div>

                    <div
                      class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-0.5"
                    >
                      <span>
                        操作人:
                        <span class="font-medium text-foreground ml-1">
                          {{
                            subjectDisplayName(
                              item.operatorType,
                              item.operatorId,
                            )
                          }}
                        </span>
                      </span>
                      <span
                        v-if="item.traceId"
                        class="font-mono text-[11px] text-muted-foreground/80"
                      >
                        Trace: {{ item.traceId }}
                      </span>
                    </div>
                  </div>
                </TimelineItem>
              </Timeline>
            </div>
            <Empty v-else description="暂无操作记录" />
          </TabPane>

          <TabPane key="versions" :tab="`版本历史（${versions.length}）`">
            <div v-if="versions.length > 0" class="version-list pt-2">
              <article
                v-for="version in versions"
                :key="String(version.policyGroupVersionId)"
                class="version-row"
              >
                <div class="flex items-center gap-2">
                  <strong>v{{ version.versionNo }}</strong>
                  <Tooltip :title="versionTag(version).tip">
                    <Tag :color="versionTag(version).color">
                      {{ versionTag(version).label }}
                    </Tag>
                  </Tooltip>
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ version.createdTime
                  }}<template v-if="version.publishedTime">
                    · 发布于 {{ version.publishedTime }}
                  </template>
                </div>
                <code>{{ version.contentHash }}</code>
              </article>
            </div>
            <Empty v-else description="暂无版本记录" />
          </TabPane>
        </Tabs>
      </template>
      <Empty v-else-if="!loading" description="未找到策略组信息" />
    </Spin>
  </Drawer>
</template>

<style scoped>
.log-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  background: hsl(var(--muted) / 30%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.version-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.version-list {
  display: grid;
  gap: 8px;
}

.version-row {
  padding: 12px 14px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.version-row code {
  display: block;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}
</style>
