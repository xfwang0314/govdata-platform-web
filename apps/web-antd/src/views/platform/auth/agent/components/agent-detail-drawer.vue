<script setup lang="ts">
import type { AgentTokenView } from '#/api/platform/mcp/model';

import { computed, ref } from 'vue';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Drawer,
  message,
  Progress,
  Tag,
  TypographyText,
} from 'antdv-next';

import { useAgentConfigs } from '../composables/use-agent-configs';
import { useMcpOptions } from '../composables/use-mcp-options';
import { CATEGORY_THEMES } from '../data';
import ToolMetadataList from './tool-metadata-list.vue';

const { options } = useMcpOptions();
const { generateStandardMcpConfig } = useAgentConfigs();

const visible = ref(false);
const currentToken = ref<AgentTokenView | null>(null);

const authorizedCategoriesWithTools = computed(() => {
  if (!currentToken.value || !options.value?.categories) return [];
  const allowed = currentToken.value.allowedCategories ?? [];
  return options.value.categories.filter((cat) => allowed.includes(cat.value));
});

const usagePercent = computed(() => {
  if (!currentToken.value || !currentToken.value.maxDailyRequests) return 0;
  const used = currentToken.value.usedRequestsToday ?? 0;
  const max = currentToken.value.maxDailyRequests;
  return Math.min(Math.round((used / max) * 100), 100);
});

const standardConfigJson = computed(() => {
  return generateStandardMcpConfig('<YOUR_AGENT_TOKEN>');
});

function open(token: AgentTokenView) {
  currentToken.value = token;
  visible.value = true;
}

function handleCopy(text?: string, tip = '复制成功') {
  if (!text) return;
  navigator.clipboard.writeText(text);
  message.success(tip);
}

defineExpose({ open });
</script>

<template>
  <Drawer
    v-model:open="visible"
    title="Agent 详情与客户端连接配置"
    :width="720"
    destroy-on-close
  >
    <div v-if="currentToken" class="space-y-5">
      <!-- 模块 1：头部概览卡片 (精简整洁，无重复复制项) -->
      <div class="p-4 bg-muted/30 rounded-xl border space-y-3">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-foreground m-0">
                {{ currentToken.agentName }}
              </h3>
              <Tag v-if="currentToken.status === 'ACTIVE'" color="success">
                启用中
              </Tag>
              <Tag
                v-else-if="currentToken.status === 'DISABLED'"
                color="warning"
              >
                已停用
              </Tag>
              <Tag v-else-if="currentToken.status === 'REVOKED'" color="error">
                已吊销
              </Tag>
            </div>
            <div class="text-xs font-mono text-muted-foreground">
              业务编码: {{ currentToken.agentCode }}
            </div>
          </div>
        </div>

        <!-- 配额使用率进度 -->
        <div class="space-y-1.5 pt-2 border-t border-border/50">
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted-foreground">今日调用配额消耗</span>
            <span class="font-medium">
              <span class="text-primary font-bold">{{
                currentToken.usedRequestsToday ?? 0
              }}</span>
              / {{ currentToken.maxDailyRequests }} 次 ({{ usagePercent }}%)
            </span>
          </div>
          <Progress
            :percent="usagePercent"
            :status="usagePercent >= 90 ? 'exception' : 'normal'"
            :stroke-color="usagePercent >= 90 ? '#ef4444' : '#3b82f6'"
            size="small"
          />
        </div>
      </div>

      <!-- 模块 2：基本属性信息 -->
      <Descriptions title="基本信息" :column="2" bordered size="small">
        <DescriptionsItem label="所属用户">
          {{ currentToken.userName || currentToken.userId }}
        </DescriptionsItem>
        <DescriptionsItem label="所属部门">
          {{ currentToken.deptName || currentToken.deptId }}
        </DescriptionsItem>
        <DescriptionsItem label="Token 前缀标识" :span="2">
          <TypographyText code class="text-xs font-mono select-all">
            {{ currentToken.tokenPrefix }}…
          </TypographyText>
        </DescriptionsItem>
        <DescriptionsItem label="有效期限">
          {{ currentToken.expireTime || '长期有效' }}
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">
          {{ currentToken.createTime }}
        </DescriptionsItem>
        <DescriptionsItem label="最后活跃时间">
          {{ currentToken.lastUsedTime || '暂无调用记录' }}
        </DescriptionsItem>
        <DescriptionsItem label="最后轮换时间">
          {{ currentToken.lastRotatedTime || '尚未轮换' }}
        </DescriptionsItem>
        <DescriptionsItem label="轮换次数">
          {{ currentToken.rotationCount ?? 0 }} 次
        </DescriptionsItem>
        <DescriptionsItem label="用途说明" :span="2">
          {{ currentToken.remark || '无' }}
        </DescriptionsItem>
      </Descriptions>

      <!-- 模块 3：标准 MCP 客户端连接配置 (单项正规配置) -->
      <div class="p-4 bg-card rounded-xl border space-y-3 shadow-2xs">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-bold text-foreground">
              标准 MCP 客户端连接配置
            </div>
            <div class="text-xs text-muted-foreground mt-0.5">
              主协议为 Streamable HTTP；请将占位符替换为创建时保存的 Token
            </div>
          </div>
          <Button
            size="small"
            type="primary"
            class="shrink-0 text-xs"
            @click="
              handleCopy(standardConfigJson, '标准 MCP 客户端配置已复制！')
            "
          >
            复制配置 JSON
          </Button>
        </div>

        <!-- 优雅多行缩进 JSON 视窗 -->
        <pre
          class="code-block m-0 p-3.5 bg-zinc-950 text-zinc-100 rounded-xl border border-zinc-800 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed select-all"
        ><code class="font-mono whitespace-pre leading-relaxed">{{ standardConfigJson }}</code></pre>
      </div>

      <!-- 模块 4：已授权 MCP 模块与 Tools 工具明细 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="font-semibold text-sm text-foreground">
            已授权 MCP 模块与可用 Tools 工具明细
          </div>
          <Tag color="blue">
            共 {{ authorizedCategoriesWithTools.length }} 个模块
          </Tag>
        </div>

        <div class="space-y-3">
          <div
            v-for="cat in authorizedCategoriesWithTools"
            :key="cat.value"
            class="p-3.5 bg-background rounded-xl border border-border space-y-2.5 shadow-2xs"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-sm text-foreground">{{
                  cat.label
                }}</span>
                <span class="text-xs text-muted-foreground font-mono">({{ cat.code }})</span>
              </div>
              <Tag v-if="cat.tools?.length" color="processing" class="text-xs">
                {{ cat.tools.length }} 个可用 Tools
              </Tag>
            </div>

            <div class="text-xs text-muted-foreground">
              {{
                CATEGORY_THEMES[cat.value]?.desc || '提供该领域的受控操作能力'
              }}
            </div>

            <div class="border-t border-border/50 pt-2">
              <ToolMetadataList :tools="cat.tools" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.code-block {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  tab-size: 2;
  white-space: pre !important;
}
</style>
