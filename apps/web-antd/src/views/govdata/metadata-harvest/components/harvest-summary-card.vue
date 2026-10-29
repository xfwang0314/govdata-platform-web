<script setup lang="ts">
import { DatabaseOutlined, ProfileOutlined } from '@antdv-next/icons';

defineProps<{
  datasourceCount: number;
  datasourceName?: string;
  planCount: number;
}>();
</script>

<template>
  <section
    class="management-summary flex shrink-0 items-center justify-between rounded-xl border border-border/80 bg-card px-4 py-3 shadow-xs"
  >
    <div class="flex min-w-0 items-center gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-base text-teal-600 dark:text-teal-400"
        aria-hidden="true"
      >
        <ProfileOutlined />
      </div>
      <div class="min-w-0">
        <h2
          class="truncate text-sm font-semibold tracking-tight text-foreground"
        >
          元数据采集
        </h2>
        <p class="truncate text-xs text-muted-foreground">
          {{
            datasourceName
              ? `管理“${datasourceName}”的采集计划、范围和调度`
              : '按数据源配置技术元数据采集范围和运行调度'
          }}
        </p>
      </div>
    </div>
    <div class="harvest-summary__metrics flex items-center gap-2">
      <div
        class="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
      >
        <ProfileOutlined class="text-primary" />
        <span class="font-mono text-sm font-bold text-foreground">{{
          planCount
        }}</span>
        <small class="text-xs">采集计划</small>
      </div>
      <div
        class="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
      >
        <DatabaseOutlined class="text-teal-600 dark:text-teal-400" />
        <span class="font-mono text-sm font-bold text-foreground">{{
          datasourceName ? 1 : datasourceCount
        }}</span>
        <small class="text-xs">数据源</small>
      </div>
    </div>
  </section>
</template>

<style scoped>
@media (max-width: 768px) {
  .harvest-summary__metrics {
    display: none;
  }
}
</style>
