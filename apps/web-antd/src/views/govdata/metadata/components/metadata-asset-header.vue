<script setup lang="ts">
import type { MetadataAssetView } from '#/api/govdata/metadata/model';

import { CopyOutlined, TableOutlined } from '@antdv-next/icons';
import { Button, message } from 'antdv-next';
defineProps<{
  asset: Pick<
    MetadataAssetView,
    'assetCode' | 'assetId' | 'displayName' | 'originalName'
  >;
  caption?: string;
}>();
async function copy(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    message.success('资产编码已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}
</script>
<template>
  <header class="metadata-asset-header">
    <div class="flex min-w-0 items-start gap-3">
      <TableOutlined class="mt-1 shrink-0 text-muted-foreground" />
      <div class="min-w-0 flex-1">
        <div v-if="caption" class="mb-1 text-xs text-muted-foreground">
          {{ caption }}
        </div>
        <h3 class="break-words text-lg font-semibold">
          {{ asset.displayName || asset.originalName }}
        </h3>
        <p
          v-if="asset.displayName && asset.displayName !== asset.originalName"
          class="mt-1 break-all text-muted-foreground"
        >
          {{ asset.originalName }}
        </p>
      </div>
      <slot></slot>
    </div>
    <div
      class="mt-3 flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
    >
      <span class="truncate" :title="asset.assetCode">{{
        asset.assetCode
      }}</span><Button
        type="text"
        size="small"
        aria-label="复制资产编码"
        title="复制资产编码"
        @click="copy(asset.assetCode)"
      >
        <template #icon><CopyOutlined /></template>
      </Button>
    </div>
  </header>
</template>
<style scoped>
.metadata-asset-header {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--gov-console-divider);
}
</style>
