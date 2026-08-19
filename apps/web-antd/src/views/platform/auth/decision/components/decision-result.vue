<script setup lang="ts">
import type { AccessDecision } from '#/api/platform/auth/model';

import { computed, ref } from 'vue';

import { Button, Empty, Modal, Table, Tag } from 'antdv-next';

export interface DecisionItemResult {
  action: string;
  actionLabel?: string;
  decision?: AccessDecision;
  error?: string;
  key: string;
  purpose?: string;
  purposeLabel?: string;
  resourceId: number | string;
  resourceLabel: string;
}

const props = defineProps<{
  results: DecisionItemResult[];
}>();

const currentDetail = ref<DecisionItemResult | null>(null);
const detailVisible = ref(false);

const summary = computed(() => {
  let permit = 0;
  let deny = 0;
  let error = 0;
  for (const item of props.results) {
    if (item.error) {
      error++;
    } else if (item.decision?.decision === 'PERMIT') {
      permit++;
    } else {
      deny++;
    }
  }
  return {
    deny,
    error,
    permit,
    total: props.results.length,
  };
});

function showDetail(item: DecisionItemResult) {
  currentDetail.value = item;
  detailVisible.value = true;
}

const columns = [
  {
    dataIndex: 'resourceLabel',
    key: 'resourceLabel',
    title: '目标资源',
  },
  {
    dataIndex: 'action',
    key: 'action',
    title: '请求动作',
    width: 130,
  },
  {
    dataIndex: 'purpose',
    key: 'purpose',
    title: '验证用途',
    width: 140,
  },
  {
    dataIndex: 'decision',
    key: 'decision',
    title: '决策结论',
    width: 160,
  },
  {
    dataIndex: 'reason',
    key: 'reason',
    title: '原因与判定依据',
  },
  {
    dataIndex: 'operation',
    key: 'operation',
    title: '操作',
    width: 90,
  },
];
</script>

<template>
  <section class="overflow-hidden rounded-xl border bg-card shadow-sm">
    <header
      class="flex flex-col gap-2 border-b px-6 py-3.5 md:flex-row md:items-center md:justify-between"
    >
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-bold tracking-tight text-foreground">
          决策验证结果矩阵
        </h3>
        <span v-if="results.length > 0" class="text-xs text-muted-foreground">
          共执行
          <b class="font-mono text-foreground">{{ summary.total }}</b> 项验证
        </span>
      </div>

      <!-- 统计指标 Tag -->
      <div v-if="results.length > 0" class="flex items-center gap-2">
        <Tag color="success" class="px-2 py-0.5 font-medium">
          放行通过: {{ summary.permit }}
        </Tag>
        <Tag color="error" class="px-2 py-0.5 font-medium">
          拒绝访问: {{ summary.deny }}
        </Tag>
        <Tag
          v-if="summary.error > 0"
          color="warning"
          class="px-2 py-0.5 font-medium"
        >
          异常失败: {{ summary.error }}
        </Tag>
      </div>
    </header>

    <div class="p-6">
      <div v-if="results.length === 0" class="py-8">
        <Empty description="暂无验证结果，请在上方配置参数并点击「执行验证」" />
      </div>

      <div v-else class="space-y-4">
        <Table
          :columns="columns"
          :data-source="results"
          :pagination="{ pageSize: 10, showSizeChanger: true }"
          size="middle"
          row-key="key"
        >
          <!-- 目标资源 -->
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'resourceLabel'">
              <span class="font-medium text-foreground text-xs">
                {{ record.resourceLabel }}
              </span>
            </template>

            <!-- 请求动作 -->
            <template v-else-if="column.key === 'action'">
              <Tag color="blue" class="font-mono text-xs">
                {{ record.actionLabel || record.action }}
              </Tag>
            </template>

            <!-- 验证用途 -->
            <template v-else-if="column.key === 'purpose'">
              <span v-if="record.purpose" class="text-xs text-muted-foreground">
                {{ record.purposeLabel || record.purpose }}
              </span>
              <Tag v-else color="cyan" class="text-[11px]"> 全用途推导 </Tag>
            </template>

            <!-- 决策结论 -->
            <template v-else-if="column.key === 'decision'">
              <template v-if="record.error">
                <Tag color="warning">执行异常</Tag>
              </template>
              <template v-else-if="record.decision?.decision === 'PERMIT'">
                <div class="flex items-center gap-1.5">
                  <span
                    class="inline-block h-2 w-2 rounded-full bg-emerald-500"
                  ></span>
                  <span
                    class="font-semibold text-emerald-600 dark:text-emerald-400 text-xs"
                  >
                    放行 (PERMIT)
                  </span>
                </div>
              </template>
              <template v-else>
                <div class="flex items-center gap-1.5">
                  <span
                    class="inline-block h-2 w-2 rounded-full bg-rose-500"
                  ></span>
                  <span
                    class="font-semibold text-rose-600 dark:text-rose-400 text-xs"
                  >
                    拒绝 (DENY)
                  </span>
                </div>
              </template>
            </template>

            <!-- 原因与依据 -->
            <template v-else-if="column.key === 'reason'">
              <div class="space-y-0.5 text-xs">
                <div class="text-foreground">
                  {{ record.error || record.decision?.reason || '-' }}
                </div>
                <div
                  v-if="record.decision?.reasonCode"
                  class="font-mono text-[11px] text-muted-foreground"
                >
                  代码: {{ record.decision.reasonCode }}
                </div>
              </div>
            </template>

            <!-- 操作 -->
            <template v-else-if="column.key === 'operation'">
              <Button
                v-if="record.decision"
                size="small"
                type="link"
                class="!px-0"
                @click="showDetail(record)"
              >
                诊断明细
              </Button>
              <span v-else class="text-xs text-muted-foreground">-</span>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- 决策诊断明细弹窗 -->
    <Modal
      v-model:open="detailVisible"
      title="授权决策诊断明细"
      :footer="null"
      width="680px"
    >
      <div v-if="currentDetail?.decision" class="space-y-4 py-2">
        <div
          class="flex items-center justify-between rounded-lg border p-4"
          :class="
            currentDetail.decision.decision === 'PERMIT'
              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-950 dark:bg-emerald-950/20'
              : 'border-rose-200 bg-rose-50/50 dark:border-rose-950 dark:bg-rose-950/20'
          "
        >
          <div>
            <div class="flex items-center gap-2">
              <span
                class="text-base font-bold"
                :class="
                  currentDetail.decision.decision === 'PERMIT'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                "
              >
                {{
                  currentDetail.decision.decision === 'PERMIT'
                    ? '放行 (PERMIT)'
                    : '拒绝 (DENY)'
                }}
              </span>
              <Tag
                :color="
                  currentDetail.decision.decision === 'PERMIT'
                    ? 'success'
                    : 'error'
                "
              >
                {{ currentDetail.decision.reasonCode }}
              </Tag>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ currentDetail.decision.reason }}
            </p>
          </div>
        </div>

        <!-- 命中规则统计 -->
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg border bg-muted/20 p-3">
            <span class="text-xs text-muted-foreground">命中策略版本数</span>
            <div class="font-mono text-lg font-bold text-foreground mt-0.5">
              {{ currentDetail.decision.matchedPolicyIds.length }}
            </div>
            <div class="mt-2 space-y-1">
              <div
                v-for="id in currentDetail.decision.matchedPolicyIds"
                :key="id"
                class="font-mono text-xs text-muted-foreground"
              >
                • PolicyVersion #{{ id }}
              </div>
            </div>
          </div>

          <div class="rounded-lg border bg-muted/20 p-3">
            <span class="text-xs text-muted-foreground">命中共享授权凭证数</span>
            <div class="font-mono text-lg font-bold text-foreground mt-0.5">
              {{ currentDetail.decision.matchedGrantIds.length }}
            </div>
            <div class="mt-2 space-y-1">
              <div
                v-for="id in currentDetail.decision.matchedGrantIds"
                :key="id"
                class="font-mono text-xs text-muted-foreground"
              >
                • GrantCredential #{{ id }}
              </div>
            </div>
          </div>
        </div>

        <!-- 义务约束 Obligation -->
        <div
          v-if="
            currentDetail.decision.obligation &&
            Object.keys(currentDetail.decision.obligation).length > 0
          "
        >
          <h4 class="text-xs font-semibold text-foreground mb-1.5">
            附加义务约束（Obligation）
          </h4>
          <pre
            class="max-h-48 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-xs text-foreground"
            >{{
              JSON.stringify(currentDetail.decision.obligation, null, 2)
            }}</pre>
        </div>
      </div>
    </Modal>
  </section>
</template>
