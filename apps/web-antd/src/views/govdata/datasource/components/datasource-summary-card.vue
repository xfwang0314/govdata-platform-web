<script setup lang="ts">
import { ApiOutlined, DatabaseOutlined } from '@antdv-next/icons';

defineProps<{
  connectorCategoriesCount: number;
  connectorCount: number;
}>();
</script>

<template>
  <section class="management-summary shrink-0">
    <div class="management-summary__identity">
      <div class="management-summary__mark datasource-mark" aria-hidden="true">
        <DatabaseOutlined />
      </div>
      <div>
        <h2 class="text-base font-semibold tracking-tight">数据连接目录</h2>
        <p class="mt-0.5 text-xs text-muted-foreground">
          统一管理外部数据连接、凭据引用和连通性状态
        </p>
      </div>
    </div>
    <div class="management-summary__metrics">
      <div class="management-metric">
        <DatabaseOutlined />
        <span>{{ connectorCount }}</span>
        <small>连接器</small>
      </div>
      <div class="management-metric">
        <ApiOutlined />
        <span>{{ connectorCategoriesCount }}</span>
        <small>协议类别</small>
      </div>
    </div>
  </section>
</template>

<style scoped>
.management-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 12px 16px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.management-summary__identity,
.management-summary__metrics,
.management-metric {
  display: flex;
  align-items: center;
}

.management-summary__identity {
  gap: 12px;
}

.management-summary__mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 9px;
}

.datasource-mark {
  color: #087a72;
  background: rgb(13 148 136 / 9%);
  border: 1px solid rgb(13 148 136 / 20%);
}

.management-summary__metrics {
  gap: 8px;
}

.management-metric {
  gap: 7px;
  min-width: 110px;
  padding: 8px 11px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 45%);
  border-radius: 8px;
}

.management-metric span {
  font-size: 16px;
  font-weight: 650;
  color: hsl(var(--foreground));
}

.management-metric small {
  font-size: 12px;
}

@media (max-width: 800px) {
  .management-summary__metrics {
    display: none;
  }
}
</style>
