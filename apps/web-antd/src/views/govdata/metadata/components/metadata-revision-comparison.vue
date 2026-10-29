<script setup lang="ts">
import type { RevisionDifference } from '../revision-diff';

import { computed } from 'vue';

import { Alert, Button, Empty, Modal, Spin, Table, Tag } from 'antdv-next';
const props = defineProps<{
  failed: boolean;
  loading: boolean;
  rows: RevisionDifference[];
  title: string;
}>();
const emit = defineEmits<{ retry: [] }>();
const open = defineModel<boolean>('open', { default: false });
const count = (type: string) =>
  new Set(
    props.rows
      .filter((row) => row.changeType === type)
      .map((row) => row.columnId),
  ).size;
const stats = computed(
  () =>
    `新增 ${count('ADDED')} · 删除 ${count('REMOVED')} · 变更 ${count('CHANGED')} 个字段`,
);
const columns = [
  { dataIndex: 'columnName', title: '字段', width: 170 },
  { dataIndex: 'property', title: '变化属性', width: 110 },
  { dataIndex: 'beforeValue', title: '旧版本', width: 310 },
  { dataIndex: 'afterValue', title: '新版本', width: 310 },
];
</script>
<template>
  <Modal v-model:open="open" title="字段版本比对" :footer="null" :width="1080">
    <div class="space-y-4">
      <div
        class="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3"
      >
        <strong>{{ title }}</strong><span
          v-if="!loading && !failed"
          class="text-xs text-muted-foreground"
          >{{ stats }}</span>
      </div>
      <Alert
        v-if="failed"
        type="error"
        show-icon
        message="比对加载失败，不代表两个版本一致"
      >
        <template #action>
          <Button size="small" @click="emit('retry')">重试</Button>
        </template>
      </Alert>
      <Spin v-else :spinning="loading">
        <Empty
          v-if="!loading && rows.length === 0"
          :image="Empty.PRESENTED_IMAGE_SIMPLE"
          description="两个版本的字段结构一致"
        /><Table
          v-else
          :columns="columns"
          :data-source="rows"
          :pagination="{ pageSize: 15, showSizeChanger: true }"
          row-key="key"
          :scroll="{ x: 900, y: 440 }"
          size="small"
          class="gov-console-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'columnName'">
              <div>{{ record.columnName }}</div>
              <Tag
                v-if="record.changeType !== 'CHANGED'"
                :color="record.changeType === 'REMOVED' ? 'error' : 'success'"
              >
                {{ record.changeType === 'REMOVED' ? '删除字段' : '新增字段' }}
              </Tag>
</template><template
              v-else-if="
                column.dataIndex === 'beforeValue' ||
                column.dataIndex === 'afterValue'
              "
            >
              <span class="whitespace-pre-wrap break-words">{{
                column.dataIndex === 'beforeValue'
                  ? record.beforeValue
                  : record.afterValue
              }}</span>
            </template>
          </template>
        </Table>
      </Spin>
    </div>
  </Modal>
</template>
