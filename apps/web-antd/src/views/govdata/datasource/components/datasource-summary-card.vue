<script setup lang="ts">
import { ApiOutlined, DatabaseOutlined } from '@antdv-next/icons';

defineProps<{
  connectorCategoriesCount: number;
  connectorCount: number;
}>();
</script>

<template>
  <section
    class="management-summary shrink-0 flex items-center justify-between rounded-xl border border-border/80 bg-card px-4 py-3 shadow-xs"
  >
    <div class="flex items-center gap-3">
      <div
        class="management-summary__mark flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-base"
        aria-hidden="true"
      >
        <DatabaseOutlined />
      </div>
      <div>
        <h2 class="text-sm font-semibold tracking-tight text-foreground">
          数据连接目录
        </h2>
        <p class="text-xs text-muted-foreground">
          统一管理外部数据连接、凭据引用和连通性状态
        </p>
      </div>
    </div>
    <div class="management-summary__metrics flex items-center gap-2">
      <div
        class="management-metric flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
      >
        <DatabaseOutlined class="text-primary" />
        <span class="font-mono text-sm font-bold text-foreground">{{
          connectorCount
        }}</span>
        <small class="text-xs">连接器</small>
      </div>
      <div
        class="management-metric flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
      >
        <ApiOutlined class="text-teal-600 dark:text-teal-400" />
        <span class="font-mono text-sm font-bold text-foreground">{{
          connectorCategoriesCount
        }}</span>
        <small class="text-xs">协议类别</small>
      </div>
    </div>
  </section>
</template>

<style scoped>
@media (max-width: 768px) {
  .management-summary__metrics {
    display: none;
  }
}
</style>
