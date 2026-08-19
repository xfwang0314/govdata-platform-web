<script setup lang="ts">
import type {
  AuthzOptionsView,
  ResourceDescriptor,
} from '#/api/platform/auth/model';

import { computed, ref } from 'vue';

import { CheckOutlined, CopyOutlined } from '@antdv-next/icons';
import {
  Button,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Empty,
  message,
  Skeleton,
  Tag,
} from 'antdv-next';

import { getResourceApi } from '#/api/platform/auth';

const props = defineProps<{
  departmentLabels: Record<string, string>;
  options?: AuthzOptionsView | null;
}>();

const visible = ref(false);
const loading = ref(false);
const current = ref<ResourceDescriptor>();

const selectedType = computed(() =>
  props.options?.resourceTypes.find(
    (item) => item.typeCode === current.value?.resourceType,
  ),
);

const attributeEntries = computed(() =>
  Object.entries(current.value?.attributes ?? {}).map(([key, value]) => ({
    key,
    label:
      selectedType.value?.attributes.find(
        (item) => item.path === key || item.path.endsWith(`.${key}`),
      )?.label ?? key,
    value,
  })),
);

function typeLabel(code?: string) {
  if (!code) return '-';
  return (
    props.options?.resourceTypes.find((item) => item.typeCode === code)
      ?.typeLabel ?? code
  );
}

function moduleLabel(code?: string) {
  if (!code) return '-';
  return (
    props.options?.resourceModules.find((item) => item.value === code)?.label ??
    code
  );
}

function classificationLabel(code?: string) {
  return (
    props.options?.classifications.find((item) => item.value === code)?.label ??
    code ??
    '-'
  );
}

function securityLevelLabel(level?: number) {
  if (level === undefined || level === null) return '-';
  return (
    props.options?.securityLevels.find(
      (item) => String(item.value) === String(level),
    )?.label ?? `安全等级 ${level}`
  );
}

function ownerDepartmentLabel(ownerDeptId?: number | string) {
  if (ownerDeptId === undefined || ownerDeptId === null) return '-';
  return props.departmentLabels[String(ownerDeptId)] ?? '未知部门';
}

function statusLabel(code?: string) {
  if (!code) return '-';
  return (
    props.options?.resourceStatuses.find((item) => item.value === code)
      ?.label ?? code
  );
}

function statusColor(status?: ResourceDescriptor['status']) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'DISABLED') return 'warning';
  return 'default';
}

const formattedAttributesJson = computed(() => {
  if (
    !current.value?.attributes ||
    Object.keys(current.value.attributes).length === 0
  ) {
    return '';
  }
  return JSON.stringify(current.value.attributes, null, 2);
});

const copied = ref(false);

async function copyAttributesJson() {
  if (!formattedAttributesJson.value) return;
  try {
    await navigator.clipboard.writeText(formattedAttributesJson.value);
    copied.value = true;
    message.success('属性 JSON 已复制到剪贴板');
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    message.error('复制失败，请手动选择复制');
  }
}

async function open(row: ResourceDescriptor) {
  current.value = row;
  visible.value = true;
  loading.value = true;
  try {
    const detail = await getResourceApi(row.resourceId);
    if (String(current.value?.resourceId) === String(row.resourceId)) {
      current.value = {
        ...row,
        ...detail,
        resourcePath: detail.resourcePath ?? row.resourcePath,
      };
    }
  } finally {
    loading.value = false;
  }
}

defineExpose({
  open,
});
</script>

<template>
  <Drawer
    v-model:open="visible"
    class="resource-detail"
    title="资源详情"
    width="min(720px, 96vw)"
  >
    <Skeleton :loading="loading" :paragraph="{ rows: 10 }" active>
      <template v-if="current">
        <div class="resource-identity-card">
          <div class="min-w-0">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <Tag :bordered="false" color="blue">
                {{ typeLabel(current.resourceType) }}
              </Tag>
              <Tag :color="statusColor(current.status)">
                {{ statusLabel(current.status) }}
              </Tag>
            </div>
            <h3 class="truncate text-lg font-semibold">
              {{ current.resourceName }}
            </h3>
            <div class="mt-1 truncate font-mono text-xs text-muted-foreground">
              {{ current.resourceCode }}
            </div>
          </div>
          <div class="resource-level-badge">
            <span>{{ classificationLabel(current.classification) }}</span>
            <strong>{{ securityLevelLabel(current.securityLevel) }}</strong>
          </div>
        </div>

        <section class="mt-5">
          <div class="section-heading">
            <div>
              <h4>资源上下文</h4>
              <p>用于确认资源来源、稳定标识和权属边界</p>
            </div>
          </div>
          <Descriptions bordered :column="2" size="small">
            <DescriptionsItem label="来源模块">
              {{ moduleLabel(current.sourceModule) }}
            </DescriptionsItem>
            <DescriptionsItem label="资源类型">
              {{ typeLabel(current.resourceType) }}
            </DescriptionsItem>
            <DescriptionsItem label="业务标识">
              <span class="font-mono text-xs">{{ current.businessId }}</span>
            </DescriptionsItem>
            <DescriptionsItem label="权属部门">
              {{ ownerDepartmentLabel(current.ownerDeptId) }}
            </DescriptionsItem>
            <DescriptionsItem label="资源路径" :span="2">
              {{ current.resourcePath || current.resourceName }}
            </DescriptionsItem>
          </Descriptions>
        </section>

        <section class="mt-5">
          <div class="section-heading">
            <div>
              <h4>授权属性</h4>
              <p>由资源所属业务模块投影，只读展示</p>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="formattedAttributesJson"
                class="text-xs text-muted-foreground"
              >
                {{ attributeEntries.length }} 项属性
              </span>
              <Button
                v-if="formattedAttributesJson"
                size="small"
                type="dashed"
                @click="copyAttributesJson"
              >
                <template #icon>
                  <CheckOutlined v-if="copied" class="text-green-500" />
                  <CopyOutlined v-else />
                </template>
                {{ copied ? '已复制' : '复制 JSON' }}
              </Button>
            </div>
          </div>

          <div v-if="formattedAttributesJson" class="json-viewer mt-3">
            <pre
              class="json-code"
            ><code>{{ formattedAttributesJson }}</code></pre>
          </div>
          <Empty
            v-else
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
            class="rounded-lg border border-dashed py-5"
            description="该资源没有扩展授权属性"
          />
        </section>
      </template>
    </Skeleton>
  </Drawer>
</template>

<style scoped>
.resource-identity-card {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px;
  background:
    linear-gradient(120deg, hsl(var(--primary) / 9%), transparent 58%),
    hsl(var(--muted) / 35%);
  border: 1px solid hsl(var(--primary) / 16%);
  border-radius: 12px;
}

.resource-level-badge {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  min-width: 124px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.resource-level-badge strong {
  font-size: 14px;
  color: hsl(var(--foreground));
}

.section-heading {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.section-heading h4 {
  font-size: 14px;
  font-weight: 600;
}

.section-heading p,
.section-heading > span {
  margin-top: 2px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.json-viewer {
  max-height: 280px;
  overflow: auto;
  background: hsl(var(--muted) / 35%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.json-code {
  padding: 12px 14px;
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 12px;
  line-height: 1.55;
  color: hsl(var(--foreground));
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
