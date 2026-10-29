<script setup lang="ts">
import type {
  MetadataAssetTreeView,
  MetadataAssetView,
  MetadataOptionsView,
} from '#/api/govdata/metadata/model';

import { computed, watch } from 'vue';

import {
  CloseOutlined,
  EditOutlined,
  FieldStringOutlined,
  TableOutlined,
} from '@antdv-next/icons';
import { Alert, Button, Empty, Spin } from 'antdv-next';

import { getMetadataAssetApi } from '#/api/govdata/metadata';

import { columnType } from '../column-data';
import { findAssetPath } from '../explorer-navigation';
import { useMetadataPreview } from '../use-metadata-preview';

const props = defineProps<{
  asset?: MetadataAssetView;
  canRead: boolean;
  datasourceName?: string;
  nodes: MetadataAssetTreeView[];
  options?: MetadataOptionsView;
}>();
const emit = defineEmits<{
  close: [];
  detail: [asset: MetadataAssetView];
  edit: [asset: MetadataAssetView];
  version: [asset: MetadataAssetView];
}>();
const state = useMetadataPreview(getMetadataAssetApi);
const { detail, parentTable, field, loading, failed } = state;
watch(
  [() => props.asset, () => props.canRead],
  () => {
    void state.select(props.canRead ? props.asset : undefined);
  },
  { immediate: true },
);
const path = computed(() =>
  props.asset ? findAssetPath(props.nodes, props.asset.assetId) : [],
);
const catalog = computed(() =>
  path.value.find((node) => node.assetType === 'CATALOG'),
);
const schema = computed(() =>
  path.value.find((node) => node.assetType === 'SCHEMA'),
);
function label(
  items: undefined | { label: string; value: string }[],
  value: number | string | undefined,
) {
  return (
    items?.find((item) => String(item.value) === String(value))?.label ??
    '未设置'
  );
}
</script>

<template>
  <aside class="metadata-preview" aria-label="资产快速预览">
    <header class="metadata-preview__header">
      <FieldStringOutlined v-if="asset?.assetType === 'COLUMN'" /><TableOutlined
        v-else
      />
      <strong class="min-w-0 flex-1 truncate" :title="asset?.originalName">{{
        asset?.displayName || asset?.originalName || '资产预览'
      }}</strong>
      <Button
        v-if="detail"
        v-access:code="['govdata:metadata:edit']"
        type="text"
        size="small"
        aria-label="维护治理属性"
        @click="emit('edit', detail)"
      >
        <template #icon><EditOutlined /></template>
      </Button>
      <Button
        type="text"
        size="small"
        aria-label="关闭资产预览"
        @click="emit('close')"
      >
        <template #icon><CloseOutlined /></template>
      </Button>
    </header>
    <div class="metadata-preview__body">
      <Empty
        v-if="!asset"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
        description="选择资产查看概览"
      />
      <Empty
        v-else-if="!canRead"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
        description="暂无详情查看权限"
      />
      <Alert v-else-if="failed" type="error" show-icon message="预览加载失败">
        <template #action>
          <Button size="small" @click="state.select(asset)"> 重试 </Button>
        </template>
      </Alert>
      <Spin v-else :spinning="loading" class="block min-h-40">
        <template v-if="detail">
          <section class="metadata-preview__section">
            <h4>描述</h4>
            <p class="whitespace-pre-wrap break-words text-muted-foreground">
              {{
                detail.description ||
                detail.commentText ||
                field?.commentText ||
                '暂无描述'
              }}
            </p>
          </section>
          <section class="metadata-preview__section">
            <h4>概览</h4>
            <dl class="metadata-preview__properties">
              <template v-if="field">
                <dt>数据类型</dt>
                <dd>{{ columnType(field) }}</dd>
                <dt>约束</dt>
                <dd>
                  {{ field.primaryKeyFlag ? '主键 · ' : ''
                  }}{{
                    field.nullableFlag === true
                      ? '可空'
                      : field.nullableFlag === false
                        ? '非空'
                        : '未提供'
                  }}
                </dd>
                <dt>默认值</dt>
                <dd>{{ field.defaultExpression ?? '未提供' }}</dd>
              </template>
              <template v-if="parentTable">
                <dt>所属数据表</dt>
                <dd>{{ parentTable.originalName }}</dd>
              </template>
              <dt>连接</dt>
              <dd>{{ datasourceName || '—' }}</dd>
              <template v-if="catalog">
                <dt>数据库</dt>
                <dd>{{ catalog.originalName }}</dd>
              </template>
              <template v-if="schema">
                <dt>数据模式</dt>
                <dd>{{ schema.originalName }}</dd>
              </template>
              <dt>物理名</dt>
              <dd>{{ detail.originalName }}</dd>
              <dt>资产编码</dt>
              <dd>{{ detail.assetCode }}</dd>
              <dt>技术状态</dt>
              <dd>
                {{ label(options?.technicalStatuses, detail.technicalStatus) }}
              </dd>
              <dt>治理状态</dt>
              <dd>
                {{
                  label(options?.governanceStatuses, detail.governanceStatus)
                }}
              </dd>
            </dl>
          </section>
          <section class="metadata-preview__section">
            <h4>安全分类分级</h4>
            <p>
              {{ label(options?.classifications, detail.classificationCode) }} ·
              {{ label(options?.securityLevels, detail.securityLevel) }}
            </p>
          </section>
        </template>
      </Spin>
    </div>
    <footer v-if="detail && !failed" class="metadata-preview__actions">
      <Button
        v-access:code="['govdata:metadata:query']"
        @click="emit('detail', detail)"
      >
        完整详情
      </Button>
      <Button
        v-if="detail.assetType === 'TABLE' || parentTable"
        v-access:code="['govdata:metadata:revision:list']"
        @click="emit('version', parentTable || detail)"
      >
        查看版本
      </Button>
    </footer>
  </aside>
</template>

<style scoped>
.metadata-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: hsl(var(--card));
}

.metadata-preview__header {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 52px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gov-console-divider);
}

.metadata-preview__header strong {
  color: hsl(var(--primary));
}

.metadata-preview__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.metadata-preview__section {
  padding: 18px 16px;
  border-bottom: 1px solid var(--gov-console-divider);
}

.metadata-preview__section h4 {
  margin-bottom: 14px;
  font-weight: 600;
}

.metadata-preview__properties {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  gap: 16px 12px;
}

.metadata-preview__properties dt {
  color: hsl(var(--muted-foreground));
}

.metadata-preview__properties dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.metadata-preview__actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--gov-console-divider);
}
</style>
