<script setup lang="ts">
import {
  AppstoreOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
} from '@antdv-next/icons';

defineProps<{
  catalogResourceTypeCount: number;
  sourceModuleCount: number;
}>();
</script>

<template>
  <section class="resource-summary shrink-0">
    <div class="resource-summary__identity">
      <div class="resource-summary__mark" aria-hidden="true">
        <SafetyCertificateOutlined />
      </div>
      <div>
        <h2 class="text-base font-semibold tracking-tight">授权资源台账</h2>
        <p class="mt-0.5 text-xs text-muted-foreground">
          查看各业务模块投影到授权中心的资源、权属与安全属性
        </p>
      </div>
    </div>
    <div class="resource-summary__metrics">
      <div class="resource-metric">
        <AppstoreOutlined />
        <span>{{ sourceModuleCount }}</span>
        <small>来源模块</small>
      </div>
      <div class="resource-metric">
        <DatabaseOutlined />
        <span>{{ catalogResourceTypeCount }}</span>
        <small>资源类型</small>
      </div>
    </div>
  </section>
</template>

<style scoped>
.resource-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 12px 16px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.resource-summary__identity,
.resource-summary__metrics,
.resource-metric {
  display: flex;
  align-items: center;
}

.resource-summary__identity {
  gap: 12px;
}

.resource-summary__mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
  border: 1px solid hsl(var(--primary) / 18%);
  border-radius: 9px;
}

.resource-summary__metrics {
  gap: 8px;
}

.resource-metric {
  gap: 7px;
  min-width: 116px;
  padding: 8px 11px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 45%);
  border-radius: 8px;
}

.resource-metric span {
  font-size: 16px;
  font-weight: 650;
  color: hsl(var(--foreground));
}

.resource-metric small {
  font-size: 12px;
}

@media (max-width: 900px) {
  .resource-summary__metrics {
    display: none;
  }
}
</style>
