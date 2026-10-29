<script setup lang="ts">
import type { McpToolSummaryItem } from '#/api/platform/mcp/model';

import { Tag } from 'antdv-next';

defineProps<{
  tools?: readonly McpToolSummaryItem[];
}>();

function getParamEntries(tool: McpToolSummaryItem): Array<{
  description?: string;
  name: string;
  required: boolean;
  type: string;
}> {
  const schema = tool.inputSchema;
  if (!schema || typeof schema.properties !== 'object') return [];

  const required = Array.isArray(schema.required) ? schema.required : [];
  const properties = schema.properties as Record<
    string,
    { description?: string; type?: string }
  >;

  return Object.entries(properties).map(([name, property]) => ({
    description: property?.description,
    name,
    required: required.includes(name),
    type: property?.type || 'any',
  }));
}
</script>

<template>
  <div v-if="tools?.length" class="space-y-3">
    <article
      v-for="tool in tools"
      :key="tool.name"
      class="tool-card overflow-hidden rounded-xl border border-border bg-background shadow-2xs"
    >
      <div class="flex items-start justify-between gap-4 px-3.5 py-3">
        <div class="min-w-0 space-y-1">
          <div class="break-all font-mono text-xs font-bold text-foreground">
            {{ tool.name }}
          </div>
          <p class="m-0 text-xs leading-relaxed text-muted-foreground">
            {{ tool.description || '暂无功能描述' }}
          </p>
        </div>
        <Tag
          :color="
            tool.riskLevel === 'HIGH'
              ? 'error'
              : tool.riskLevel === 'MEDIUM'
                ? 'warning'
                : 'success'
          "
          class="m-0 shrink-0 text-[10px] font-medium"
        >
          {{ tool.riskLevel || 'LOW' }} 风险等级
        </Tag>
      </div>

      <div class="border-t border-border/60 bg-muted/20 px-3.5 py-3">
        <div
          class="mb-2 flex items-center justify-between text-xs font-semibold text-foreground"
        >
          <span>入参规格与类型约束</span>
          <span class="font-normal text-muted-foreground">
            {{ getParamEntries(tool).length }} 个参数
          </span>
        </div>

        <div v-if="getParamEntries(tool).length > 0" class="space-y-1.5">
          <div
            v-for="param in getParamEntries(tool)"
            :key="param.name"
            class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-lg border border-border/50 bg-background px-2.5 py-2"
          >
            <div class="min-w-0 space-y-0.5">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="break-all font-mono text-xs font-bold text-foreground"
                >
                  {{ param.name }}
                </span>
                <span
                  v-if="param.required"
                  class="text-[11px] font-semibold text-red-500"
                >
                  * 必填
                </span>
                <span v-else class="text-[11px] text-muted-foreground">
                  可选
                </span>
              </div>
              <p
                v-if="param.description"
                class="m-0 text-[11px] leading-relaxed text-muted-foreground"
              >
                {{ param.description }}
              </p>
              <p v-else class="m-0 text-[11px] text-muted-foreground/70">
                暂无参数说明
              </p>
            </div>
            <Tag color="geekblue" class="m-0 shrink-0 font-mono text-[10px]">
              {{ param.type }}
            </Tag>
          </div>
        </div>

        <div
          v-else
          class="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground"
        >
          该 Tool 无需输入参数
        </div>
      </div>
    </article>
  </div>

  <div
    v-else
    class="rounded-xl border border-dashed px-4 py-5 text-center text-xs text-muted-foreground"
  >
    当前模块尚未注册可用 Tool
  </div>
</template>

<style scoped>
.tool-card {
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.tool-card:hover {
  border-color: color-mix(in srgb, hsl(var(--primary)) 35%, transparent);
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
}
</style>
