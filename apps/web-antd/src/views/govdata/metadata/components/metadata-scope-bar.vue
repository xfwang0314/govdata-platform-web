<script setup lang="ts">
import type { ID } from '#/api/common';
import type { MetadataAssetTreeView } from '#/api/govdata/metadata/model';

import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
} from '@antdv-next/icons';
import { Button } from 'antdv-next';

interface Crumb {
  asset?: MetadataAssetTreeView;
  datasourceId: ID;
  key: string;
  label: string;
}
defineProps<{ collapsed: boolean; items: Crumb[]; loading: boolean }>();
const emit = defineEmits<{
  refresh: [];
  select: [id: ID, asset?: MetadataAssetTreeView];
  toggle: [];
}>();
</script>

<template>
  <div class="metadata-scope-bar">
    <Button
      type="text"
      :aria-label="collapsed ? '展开资源导航' : '收起资源导航'"
      :title="collapsed ? '展开资源导航' : '收起资源导航'"
      @click="emit('toggle')"
    >
      <template #icon>
        <MenuUnfoldOutlined v-if="collapsed" /><MenuFoldOutlined v-else />
      </template>
    </Button>
    <nav class="min-w-0 flex-1 overflow-auto" aria-label="当前资产位置">
      <ol class="flex min-w-0 items-center gap-2 whitespace-nowrap">
        <li class="text-muted-foreground">数据库</li>
        <li
          v-for="(item, index) in items"
          :key="item.key"
          class="flex min-w-0 shrink-0 items-center gap-2"
        >
          <span aria-hidden="true" class="text-muted-foreground">/</span>
          <button
            class="max-w-48 truncate rounded px-1 hover:text-primary focus-visible:outline-primary"
            :title="item.label"
            :aria-current="index === items.length - 1 ? 'location' : undefined"
            type="button"
            :disabled="loading"
            @click="emit('select', item.datasourceId, item.asset)"
          >
            {{ item.label }}
          </button>
        </li>
      </ol>
    </nav>
    <Button
      :loading="loading"
      :disabled="items.length === 0"
      type="text"
      aria-label="刷新当前目录"
      title="刷新当前目录"
      @click="emit('refresh')"
    >
      <template #icon><ReloadOutlined /></template>
    </Button>
  </div>
</template>

<style scoped>
.metadata-scope-bar {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 4px 8px;
  font-size: var(--gov-console-caption-size);
  border-bottom: 1px solid var(--gov-console-divider);
}

.metadata-scope-bar ol {
  padding: 0;
  margin: 0;
  list-style: none;
}

.metadata-scope-bar nav button {
  font: inherit;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}
</style>
