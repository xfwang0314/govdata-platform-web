<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Tag } from 'antdv-next';

import AgentDetailDrawer from './components/agent-detail-drawer.vue';
import AgentTokenTable from './components/agent-token-table.vue';
import CreateTokenModal from './components/create-token-modal.vue';
import { useMcpOptions } from './composables/use-mcp-options';

const modalRef = ref<InstanceType<typeof CreateTokenModal>>();
const drawerRef = ref<InstanceType<typeof AgentDetailDrawer>>();
const tableRef = ref<InstanceType<typeof AgentTokenTable>>();

const { ensureLoaded, options } = useMcpOptions();

const totalToolsCount = computed(() => {
  if (!options.value?.categories) return 0;
  return options.value.categories.reduce(
    (acc, cur) => acc + (cur.tools?.length ?? 0),
    0,
  );
});

onMounted(() => {
  ensureLoaded();
});

function handleCreate() {
  modalRef.value?.open();
}

function handleEdit(record: any) {
  modalRef.value?.open(record);
}

function handleIssued(result: any) {
  modalRef.value?.showIssued(result, 'Token 轮换成功');
  tableRef.value?.reload();
}

function handleSuccess() {
  tableRef.value?.reload();
}

function handleDetail(record: any) {
  drawerRef.value?.open(record);
}
</script>

<template>
  <Page :auto-content-height="true">
    <div
      class="agent-shell flex flex-col h-full min-h-0 bg-card rounded-xl border overflow-hidden"
    >
      <!-- 顶部轻量指标横幅 -->
      <div
        class="px-5 pt-4 pb-3 border-b bg-muted/15 flex flex-wrap items-center justify-between gap-4"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h2 class="text-base font-bold text-foreground m-0">
              Agent 访问凭据管理
            </h2>
            <Tag color="blue" class="text-xs">
              {{ options?.categories?.length ?? 0 }} 个领域模块 /
              {{ totalToolsCount }} 个可用 Tools
            </Tag>
          </div>
          <p class="text-xs text-muted-foreground m-0">
            为标准 MCP 客户端生成专属访问凭据。凭据负责认证
            Agent，实际数据访问仍受 RBAC、ABAC 与资源授权策略约束。
          </p>
        </div>
      </div>

      <!-- 表格内容 -->
      <div class="flex-1 min-h-0 p-4">
        <AgentTokenTable
          ref="tableRef"
          :is-admin="false"
          @create="handleCreate"
          @detail="handleDetail"
          @edit="handleEdit"
          @issued="handleIssued"
        />
      </div>
    </div>

    <!-- 创建凭据全屏弹窗 -->
    <CreateTokenModal ref="modalRef" @success="handleSuccess" />

    <!-- 凭据详情与多客户端配置抽屉 -->
    <AgentDetailDrawer ref="drawerRef" />
  </Page>
</template>

<style scoped>
.agent-shell {
  height: 100%;
}
</style>
