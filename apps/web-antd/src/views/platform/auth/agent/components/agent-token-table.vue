<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ID } from '#/api/common';
import type {
  AgentTokenIssuedView,
  AgentTokenView,
} from '#/api/platform/mcp/model';

import { computed, onMounted } from 'vue';

import {
  Button,
  message,
  Modal,
  Popconfirm,
  Popover,
  Progress,
  Space,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAgentTokenApi,
  disableAgentTokenApi,
  enableAgentTokenApi,
  getAgentTokenPageApi,
  revokeAgentTokenApi,
  rotateAgentTokenApi,
} from '#/api/platform/mcp';

import { useMcpOptions } from '../composables/use-mcp-options';
import { CATEGORY_THEMES, createColumns, querySchema } from '../data';

const emit = defineEmits<{
  create: [];
  detail: [AgentTokenView];
  edit: [AgentTokenView];
  issued: [AgentTokenIssuedView];
}>();

const { ensureLoaded, options } = useMcpOptions();

const categoryMap = computed(() => {
  const map: Record<
    string,
    {
      code: string;
      label: string;
      tools?: Array<{
        description?: string;
        name: string;
        riskLevel?: string;
      }>;
      value: string;
    }
  > = {};
  if (options.value?.categories) {
    for (const item of options.value.categories) {
      map[item.value] = item as any;
    }
  }
  return map;
});

function getCategoryLabel(catValue?: string): string {
  if (!catValue) return '';
  return categoryMap.value[catValue]?.label || catValue;
}

const formOptions: VbenFormProps = {
  commonConfig: {
    componentProps: { allowClear: true },
    labelWidth: 80,
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

const gridOptions: VxeGridProps<AgentTokenView> = {
  columns: createColumns(),
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const params = {
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        };
        return await getAgentTokenPageApi(params);
      },
    },
  },
  toolbarConfig: {
    custom: true,
    export: false,
    refresh: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

onMounted(async () => {
  const opt = await ensureLoaded();
  const schema = querySchema(opt);
  if (schema) {
    gridApi.formApi.updateSchema(schema);
  }
});

function handleOpenDetail(row: AgentTokenView) {
  emit('detail', row);
}

function handleRevoke(row: AgentTokenView) {
  Modal.confirm({
    title: '确认吊销该 Agent 凭据？',
    content: `吊销后，客户端将立即无法通过该 Token 访问 MCP 网关（Agent: ${row.agentName}）。`,
    okText: '确认吊销',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await revokeAgentTokenApi(row.tokenId);
        message.success('凭据已成功吊销');
        gridApi.reload();
      } catch (error: any) {
        message.error(error?.message || '吊销失败');
      }
    },
  });
}

function handleRotate(row: AgentTokenView) {
  Modal.confirm({
    title: '确认轮换该 Agent Token？',
    content: `轮换后旧 Token 立即失效，需要将新配置更新到客户端（Agent: ${row.agentName}）。`,
    okText: '确认轮换',
    cancelText: '取消',
    onOk: async () => {
      try {
        const result = await rotateAgentTokenApi(row.tokenId);
        emit('issued', result);
      } catch (error: any) {
        message.error(error?.message || 'Token 轮换失败');
      }
    },
  });
}

async function handleStatusChange(row: AgentTokenView) {
  try {
    if (row.status === 'ACTIVE') {
      await disableAgentTokenApi(row.tokenId);
      message.success('凭据已停用');
    } else {
      await enableAgentTokenApi(row.tokenId);
      message.success('凭据已启用');
    }
    gridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '状态修改失败');
  }
}

async function handleDelete(tokenId: ID) {
  try {
    await deleteAgentTokenApi(tokenId);
    message.success('凭据已成功删除');
    gridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}

function reload() {
  gridApi.reload();
}

defineExpose({ reload });
</script>

<template>
  <div class="h-full flex flex-col min-h-0">
    <Grid>
      <template #toolbar-tools>
        <Space>
          <Button
            v-access:code="['platform:mcp:agent:add']"
            type="primary"
            @click="emit('create')"
          >
            + 新建专属凭据
          </Button>
        </Space>
      </template>

      <!-- Agent 名称与详情触发 -->
      <template #agentName="{ row }">
        <Button
          type="link"
          class="p-0 font-medium text-foreground hover:text-primary transition-colors text-left"
          @click="handleOpenDetail(row)"
        >
          {{ row.agentName }}
        </Button>
      </template>

      <!-- 授权 MCP 模块列表 (单行对齐，每个 Tag 均支持 hover 查看 Tools，超出 2 个自动 +N 悬浮查看) -->
      <template #allowedCategories="{ row }">
        <div
          v-if="row.allowedCategories && row.allowedCategories.length > 0"
          class="flex items-center gap-1.5 flex-nowrap overflow-hidden py-1"
        >
          <!-- 前 2 个模块 Tag (均支持 hover 查看该模块 Tools 明细) -->
          <Popover
            v-for="catValue in row.allowedCategories.slice(0, 2)"
            :key="catValue"
            placement="topLeft"
            trigger="hover"
          >
            <template #title>
              <div class="flex items-center justify-between gap-4 py-0.5">
                <span class="font-semibold text-xs text-foreground">
                  {{ getCategoryLabel(catValue) }}
                </span>
                <span class="text-[11px] text-muted-foreground font-mono">
                  ({{ categoryMap[catValue]?.code || catValue }})
                </span>
              </div>
            </template>
            <template #content>
              <div class="max-w-xs space-y-2 py-1">
                <div class="text-xs text-muted-foreground">
                  {{
                    CATEGORY_THEMES[catValue]?.desc ||
                    '提供该领域的受控操作能力'
                  }}
                </div>
                <div
                  v-if="categoryMap[catValue]?.tools?.length"
                  class="space-y-1 pt-1 border-t border-border/50"
                >
                  <div class="text-[11px] font-medium text-muted-foreground">
                    包含 Tools ({{ categoryMap[catValue]?.tools?.length }}个):
                  </div>
                  <div class="flex flex-wrap gap-1">
                    <Tag
                      v-for="tool in categoryMap[catValue]?.tools"
                      :key="tool.name"
                      class="text-[10px] px-1 font-mono"
                    >
                      {{ tool.name }}
                    </Tag>
                  </div>
                </div>
              </div>
            </template>
            <Tag color="blue" class="m-0 text-xs cursor-pointer shrink-0">
              {{ getCategoryLabel(catValue) }}
            </Tag>
          </Popover>

          <!-- 超出 2 个使用 +N 更多气泡展开（展示剩余所有模块与 tools） -->
          <Popover
            v-if="row.allowedCategories.length > 2"
            placement="topLeft"
            trigger="hover"
          >
            <template #title>
              <div class="flex items-center justify-between gap-2 py-0.5">
                <span class="font-semibold text-xs">其他已授权模块</span>
                <Tag color="blue" class="text-[10px] m-0">
                  +{{ row.allowedCategories.length - 2 }} 个
                </Tag>
              </div>
            </template>
            <template #content>
              <div class="max-w-sm space-y-2.5 py-1">
                <div
                  v-for="catValue in row.allowedCategories.slice(2)"
                  :key="catValue"
                  class="space-y-1 pb-1.5 border-b border-border/40 last:border-b-0 last:pb-0"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-xs text-foreground">
                      {{ getCategoryLabel(catValue) }}
                    </span>
                    <span class="text-[10px] text-muted-foreground font-mono">
                      ({{ categoryMap[catValue]?.code || catValue }})
                    </span>
                  </div>
                  <div class="text-[11px] text-muted-foreground">
                    {{ CATEGORY_THEMES[catValue]?.desc }}
                  </div>
                  <div
                    v-if="categoryMap[catValue]?.tools?.length"
                    class="flex flex-wrap gap-1 pt-0.5"
                  >
                    <Tag
                      v-for="tool in categoryMap[catValue]?.tools"
                      :key="tool.name"
                      class="text-[9px] px-1 font-mono m-0"
                    >
                      {{ tool.name }}
                    </Tag>
                  </div>
                </div>
              </div>
            </template>
            <Tag
              class="m-0 text-xs cursor-pointer text-muted-foreground border-dashed shrink-0 hover:text-primary hover:border-primary"
            >
              +{{ row.allowedCategories.length - 2 }}
            </Tag>
          </Popover>
        </div>
        <span v-else class="text-xs text-muted-foreground">-</span>
      </template>

      <!-- 今日调用与配额进度 -->
      <template #quota="{ row }">
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-primary">{{
              row.usedRequestsToday ?? 0
            }}</span>
            <span class="text-muted-foreground">/ {{ row.maxDailyRequests }} 次</span>
          </div>
          <Progress
            :percent="
              Math.min(
                Math.round(
                  ((row.usedRequestsToday ?? 0) /
                    (row.maxDailyRequests || 2000)) *
                    100,
                ),
                100,
              )
            "
            :show-info="false"
            :stroke-color="
              (row.usedRequestsToday ?? 0) >=
              (row.maxDailyRequests || 2000) * 0.9
                ? '#ef4444'
                : '#3b82f6'
            "
            size="small"
          />
        </div>
      </template>

      <!-- 状态 Tag -->
      <template #status="{ row }">
        <Tag v-if="row.status === 'ACTIVE'" color="success">启用中</Tag>
        <Tag v-else-if="row.status === 'DISABLED'" color="warning">已停用</Tag>
        <Tag v-else-if="row.status === 'REVOKED'" color="error">已吊销</Tag>
        <Tag v-else>{{ row.status }}</Tag>
      </template>

      <!-- 操作栏：编辑、轮换、启停与不可逆吊销分离。 -->
      <template #action="{ row }">
        <Space size="middle">
          <Button
            type="link"
            size="small"
            class="p-0 text-xs"
            @click="handleOpenDetail(row)"
          >
            详情
          </Button>

          <Button
            v-if="row.status !== 'REVOKED'"
            v-access:code="['platform:mcp:agent:edit']"
            type="link"
            size="small"
            class="p-0 text-xs"
            @click="emit('edit', row)"
          >
            编辑
          </Button>

          <Button
            v-if="row.status !== 'REVOKED'"
            v-access:code="['platform:mcp:agent:rotate']"
            type="link"
            size="small"
            class="p-0 text-xs"
            @click="handleRotate(row)"
          >
            轮换
          </Button>

          <Popconfirm
            v-if="row.status !== 'REVOKED'"
            v-access:code="['platform:mcp:agent:status']"
            :title="
              row.status === 'ACTIVE'
                ? '确认停用该凭据？'
                : '确认重新启用该凭据？'
            "
            ok-text="确认"
            cancel-text="取消"
            @confirm="handleStatusChange(row)"
          >
            <Button type="link" size="small" class="p-0 text-xs">
              {{ row.status === 'ACTIVE' ? '停用' : '启用' }}
            </Button>
          </Popconfirm>

          <Button
            v-if="row.status !== 'REVOKED'"
            v-access:code="['platform:mcp:agent:revoke']"
            type="link"
            danger
            size="small"
            class="p-0 text-xs"
            @click="handleRevoke(row)"
          >
            吊销
          </Button>

          <Popconfirm
            v-if="row.status === 'REVOKED'"
            v-access:code="['platform:mcp:agent:delete']"
            title="确认彻底删除该已吊销凭据吗？"
            ok-text="确认删除"
            cancel-text="取消"
            ok-type="danger"
            @confirm="handleDelete(row.tokenId)"
          >
            <Button type="link" danger size="small" class="p-0 text-xs">
              删除
            </Button>
          </Popconfirm>
        </Space>
      </template>
    </Grid>
  </div>
</template>
