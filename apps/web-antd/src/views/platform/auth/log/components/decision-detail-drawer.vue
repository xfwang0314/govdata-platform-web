<script setup lang="ts">
import type {
  AuthzOptionsView,
  DecisionLogView,
} from '#/api/platform/auth/model';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Empty,
  message,
  Tag,
} from 'antdv-next';

import { getAuthzOptionsApi } from '#/api/platform/auth';

import {
  ACTION_CODE_LABELS,
  PURPOSE_CODE_LABELS,
  REASON_CODE_LABELS,
  RESOURCE_TYPE_LABELS,
  SUBJECT_TYPE_LABELS,
} from '../data';
import { useSubjectResolver } from '../use-subject-resolver';

const props = defineProps<{
  options?: AuthzOptionsView | null;
}>();

const { getSubjectDisplayName, isResolvedToName, loadSubjectData } =
  useSubjectResolver();
const visible = ref(false);
const current = ref<DecisionLogView>();
const internalOptions = ref<AuthzOptionsView | null>(null);

const activeOptions = computed(() => props.options ?? internalOptions.value);

const matchedPolicies = computed(() => {
  if (!current.value?.policyVersionIdsJson) return [];
  try {
    const list = JSON.parse(current.value.policyVersionIdsJson);
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
});

const matchedGrants = computed(() => {
  if (!current.value?.grantIdsJson) return [];
  try {
    const list = JSON.parse(current.value.grantIdsJson);
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
});

const obligationFormatted = computed(() => {
  if (!current.value?.obligationSummaryJson) return '';
  try {
    return JSON.stringify(
      JSON.parse(current.value.obligationSummaryJson),
      null,
      2,
    );
  } catch {
    return current.value.obligationSummaryJson;
  }
});

function subjectLabel(type?: string) {
  if (!type) return '-';
  const found = activeOptions.value?.subjectTypes.find(
    (item) => item.value === type,
  );
  return found?.label ?? SUBJECT_TYPE_LABELS[type] ?? type;
}

function typeLabel(code?: string) {
  if (!code) return '-';
  const found = activeOptions.value?.resourceTypes.find(
    (item) => item.typeCode === code,
  );
  return found?.typeLabel ?? RESOURCE_TYPE_LABELS[code] ?? code;
}

function actionLabel(typeCode?: string, action?: string) {
  if (!action) return '-';
  if (typeCode && activeOptions.value?.resourceTypes) {
    const foundType = activeOptions.value.resourceTypes.find(
      (item) => item.typeCode === typeCode,
    );
    const foundAction = foundType?.actions.find(
      (item) => item.value === action,
    );
    if (foundAction?.label) {
      return foundAction.label;
    }
  }
  return ACTION_CODE_LABELS[action] ?? action;
}

function purposeLabel(typeCode?: string, purpose?: string) {
  if (!purpose) return '默认用途';
  if (typeCode && activeOptions.value?.resourceTypes) {
    const foundType = activeOptions.value.resourceTypes.find(
      (item) => item.typeCode === typeCode,
    );
    const foundPurpose = foundType?.purposes.find(
      (item) => item.value === purpose,
    );
    if (foundPurpose?.label) {
      return foundPurpose.label;
    }
  }
  return PURPOSE_CODE_LABELS[purpose] ?? purpose;
}

function reasonLabel(reasonCode?: string) {
  if (!reasonCode) return '系统默认';
  return REASON_CODE_LABELS[reasonCode] ?? reasonCode;
}

function copyTraceId() {
  if (current.value?.traceId) {
    navigator.clipboard.writeText(current.value.traceId);
    message.success('Trace ID 已复制到剪贴板');
  }
}

async function loadOptionsIfNeeded() {
  if (!activeOptions.value) {
    try {
      internalOptions.value = await getAuthzOptionsApi();
    } catch {
      // 静默兜底
    }
  }
}

function open(log: DecisionLogView) {
  current.value = log;
  visible.value = true;
  loadSubjectData();
  loadOptionsIfNeeded();
}

onMounted(() => {
  loadSubjectData();
  loadOptionsIfNeeded();
});

defineExpose({ open });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="决策审计详情"
    :width="640"
    destroy-on-close
  >
    <div v-if="current" class="space-y-6">
      <!-- 顶部决策状态卡片 -->
      <div
        class="flex items-center justify-between rounded-xl border p-4"
        :class="
          current.decision === 'PERMIT'
            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-950 dark:bg-emerald-950/20'
            : 'border-rose-200 bg-rose-50/50 dark:border-rose-950 dark:bg-rose-950/20'
        "
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
            :class="
              current.decision === 'PERMIT'
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            "
          >
            {{ current.decision === 'PERMIT' ? '✓' : '✕' }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base font-bold">
                {{
                  current.decision === 'PERMIT'
                    ? '放行 (允许)'
                    : '拒绝 (未授权)'
                }}
              </span>
              <Tag
                :color="current.decision === 'PERMIT' ? 'success' : 'error'"
                class="text-xs"
              >
                {{ reasonLabel(current.reasonCode) }}
              </Tag>
            </div>
            <p class="mt-0.5 text-xs text-muted-foreground">
              耗时:
              <b class="font-mono text-foreground">{{ current.durationMs }}ms</b>
              · 发生时间: {{ current.occurredTime }}
            </p>
          </div>
        </div>
      </div>

      <!-- 链路与上下文 -->
      <section>
        <h4
          class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          链路标识与主体
        </h4>
        <div class="rounded-lg border bg-card p-3">
          <Descriptions :column="1" size="small">
            <DescriptionsItem label="Trace ID">
              <div class="flex items-center gap-2 font-mono text-xs">
                <span class="break-all font-semibold text-primary">{{
                  current.traceId
                }}</span>
                <Button
                  size="small"
                  type="link"
                  class="!p-0"
                  @click="copyTraceId"
                >
                  复制
                </Button>
              </div>
            </DescriptionsItem>
            <DescriptionsItem label="请求主体">
              <div class="flex items-center gap-2">
                <Tag class="text-[11px] px-1.5 py-0.5">
                  {{ subjectLabel(current.subjectType) }}
                </Tag>
                <span class="font-medium text-foreground">
                  {{
                    getSubjectDisplayName(
                      current.subjectType,
                      current.subjectId,
                    )
                  }}
                </span>
                <span
                  v-if="
                    isResolvedToName(current.subjectType, current.subjectId)
                  "
                  class="font-mono text-xs text-muted-foreground"
                >
                  (ID: {{ current.subjectId }})
                </span>
              </div>
            </DescriptionsItem>
          </Descriptions>
        </div>
      </section>

      <!-- 目标资源与请求动作 -->
      <section>
        <h4
          class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          目标资源与请求动作
        </h4>
        <div class="rounded-lg border bg-card p-3">
          <Descriptions :column="2" size="small">
            <DescriptionsItem label="资源类型">
              {{ typeLabel(current.resourceType) }}
              <span class="font-mono text-xs text-muted-foreground">({{ current.resourceType }})</span>
            </DescriptionsItem>
            <DescriptionsItem label="资源编码">
              <span class="font-mono font-medium">{{
                current.resourceCode
              }}</span>
            </DescriptionsItem>
            <DescriptionsItem label="请求动作">
              <Tag color="blue">
                {{ actionLabel(current.resourceType, current.actionCode) }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="访问用途">
              {{ purposeLabel(current.resourceType, current.purpose) }}
            </DescriptionsItem>
          </Descriptions>
        </div>
      </section>

      <!-- 决策命中依据 -->
      <section>
        <h4
          class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          命中决策依据
        </h4>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <!-- 命中策略版本 -->
          <div class="rounded-lg border bg-card p-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold">命中策略版本</span>
              <Tag color="cyan">{{ matchedPolicies.length }}</Tag>
            </div>
            <div class="mt-2 space-y-1">
              <div
                v-for="id in matchedPolicies"
                :key="id"
                class="rounded bg-muted/50 px-2 py-1 font-mono text-xs"
              >
                PolicyVersion #{{ id }}
              </div>
              <p
                v-if="matchedPolicies.length === 0"
                class="text-xs text-muted-foreground"
              >
                未命中显式策略版本
              </p>
            </div>
          </div>

          <!-- 命中共享授权 -->
          <div class="rounded-lg border bg-card p-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold">命中共享授权</span>
              <Tag color="purple">{{ matchedGrants.length }}</Tag>
            </div>
            <div class="mt-2 space-y-1">
              <div
                v-for="id in matchedGrants"
                :key="id"
                class="rounded bg-muted/50 px-2 py-1 font-mono text-xs"
              >
                Grant #{{ id }}
              </div>
              <p
                v-if="matchedGrants.length === 0"
                class="text-xs text-muted-foreground"
              >
                未命中运行时共享授权
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 执行约束与 Obligation -->
      <section>
        <h4
          class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          执行约束 (Obligation)
        </h4>
        <div class="rounded-lg border bg-card p-3">
          <pre
            v-if="obligationFormatted"
            class="max-h-60 overflow-auto rounded bg-muted/30 p-2 font-mono text-xs leading-relaxed"
            >{{ obligationFormatted }}</pre>
          <p v-else class="text-xs text-muted-foreground">无附加执行约束</p>
        </div>
      </section>
    </div>
    <Empty v-else description="暂无日志数据" />
  </Drawer>
</template>
