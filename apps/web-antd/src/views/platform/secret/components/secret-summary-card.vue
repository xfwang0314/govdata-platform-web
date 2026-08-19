<script setup lang="ts">
import {
  AppstoreOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
} from '@antdv-next/icons';

defineProps<{
  ownerModuleCount: number;
  secretTypeCount: number;
}>();
</script>

<template>
  <section class="secret-summary shrink-0">
    <div class="secret-summary__identity">
      <div class="secret-summary__mark" aria-hidden="true">
        <KeyOutlined />
      </div>
      <div>
        <h2 class="text-base font-semibold tracking-tight">平台凭据保险库</h2>
        <p class="mt-0.5 text-xs text-muted-foreground">
          集中管理连接账号、令牌和密钥，业务模块仅保存凭据引用
        </p>
      </div>
    </div>
    <div class="secret-summary__metrics">
      <div class="secret-metric">
        <SafetyCertificateOutlined />
        <span>{{ secretTypeCount }}</span>
        <small>凭据类型</small>
      </div>
      <div class="secret-metric">
        <AppstoreOutlined />
        <span>{{ ownerModuleCount }}</span>
        <small>接入模块</small>
      </div>
    </div>
  </section>
</template>

<style scoped>
.secret-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 12px 16px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.secret-summary__identity,
.secret-summary__metrics,
.secret-metric {
  display: flex;
  align-items: center;
}

.secret-summary__identity {
  gap: 12px;
}

.secret-summary__mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: #9a6700;
  background: rgb(202 138 4 / 9%);
  border: 1px solid rgb(202 138 4 / 20%);
  border-radius: 9px;
}

.secret-summary__metrics {
  gap: 8px;
}

.secret-metric {
  gap: 7px;
  min-width: 110px;
  padding: 8px 11px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 45%);
  border-radius: 8px;
}

.secret-metric span {
  font-size: 16px;
  font-weight: 650;
  color: hsl(var(--foreground));
}

.secret-metric small {
  font-size: 12px;
}

@media (max-width: 800px) {
  .secret-summary__metrics {
    display: none;
  }
}
</style>
