<script setup lang="ts">
import type {
  AgentTokenCreateCommand,
  AgentTokenIssuedView,
  AgentTokenView,
} from '#/api/platform/mcp/model';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Tag,
} from 'antdv-next';

import { createAgentTokenApi, updateAgentTokenApi } from '#/api/platform/mcp';

import { useMcpOptions } from '../composables/use-mcp-options';
import { CATEGORY_THEMES } from '../data';
import ToolMetadataList from './tool-metadata-list.vue';

const emit = defineEmits<{
  success: [];
}>();

const { ensureLoaded, options } = useMcpOptions();

const visible = ref(false);
const submitting = ref(false);
const issuedResult = ref<AgentTokenIssuedView | null>(null);
const editingToken = ref<AgentTokenView | null>(null);
const issuedTitle = ref('Agent 专属凭据创建成功');

// 查看 Tool 详细元数据的侧边抽屉
const toolDrawerVisible = ref(false);
const selectedCategoryForDetail = ref<any>(null);

const form = reactive<AgentTokenCreateCommand>({
  agentName: '',
  allowedCategories: ['DATASOURCE'],
  expireTime: undefined,
  maxDailyRequests: 2000,
  remark: '',
});

const categories = computed(() => {
  return options.value?.categories ?? [];
});

const totalSelectedToolsCount = computed(() => {
  if (!options.value?.categories) return 0;
  return options.value.categories
    .filter((cat) => form.allowedCategories.includes(cat.value))
    .reduce((acc, cur) => acc + (cur.tools?.length ?? 0), 0);
});

const standardConfigJson = computed(() => {
  return issuedResult.value?.clientConfigJson ?? '';
});

onMounted(() => {
  ensureLoaded();
});

function open(token?: AgentTokenView) {
  ensureLoaded();
  editingToken.value = token ?? null;
  form.agentName = token?.agentName ?? '';
  form.allowedCategories = token?.allowedCategories
    ? [...token.allowedCategories]
    : ['DATASOURCE'];
  form.expireTime = token?.expireTime;
  form.maxDailyRequests = token?.maxDailyRequests ?? 2000;
  form.remark = token?.remark ?? '';
  issuedResult.value = null;
  selectedCategoryForDetail.value = null;
  visible.value = true;
}

function showIssued(result: AgentTokenIssuedView, title = 'Token 轮换成功') {
  editingToken.value = null;
  issuedResult.value = result;
  issuedTitle.value = title;
  visible.value = true;
}

function toggleCategory(catValue: string) {
  const index = form.allowedCategories.indexOf(catValue);
  if (index === -1) {
    form.allowedCategories.push(catValue);
  } else {
    if (form.allowedCategories.length === 1) {
      message.warning('请至少保留一个允许调用的 MCP 模块');
      return;
    }
    form.allowedCategories.splice(index, 1);
  }
}

function isSelected(catValue: string): boolean {
  return form.allowedCategories.includes(catValue);
}

function selectAllCategories() {
  form.allowedCategories = categories.value.map((c) => c.value);
}

function clearAllExceptFirst() {
  const first = categories.value[0];
  if (first) {
    form.allowedCategories = [first.value];
  }
}

function openCategoryToolDetails(cat: any, e?: Event) {
  if (e) {
    e.stopPropagation();
  }
  selectedCategoryForDetail.value = cat;
  toolDrawerVisible.value = true;
}

async function handleSubmit() {
  if (!form.agentName?.trim()) {
    message.warning('请输入 Agent 名称');
    return;
  }
  if (!form.allowedCategories || form.allowedCategories.length === 0) {
    message.warning('请至少选择一个允许调用的 MCP 模块分类');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      ...form,
      agentName: form.agentName.trim(),
    };
    if (editingToken.value) {
      await updateAgentTokenApi(editingToken.value.tokenId, payload);
      message.success('Agent 访问凭据已更新');
      visible.value = false;
    } else {
      const res = await createAgentTokenApi(payload);
      issuedResult.value = res;
      issuedTitle.value = 'Agent 专属凭据创建成功';
      message.success('Agent 访问凭据生成成功！');
    }
    emit('success');
  } catch (error: any) {
    message.error(
      error?.message || (editingToken.value ? '保存失败' : '生成失败'),
    );
  } finally {
    submitting.value = false;
  }
}

function handleCopy(text?: string, tip = '复制成功') {
  if (!text) return;
  navigator.clipboard.writeText(text);
  message.success(tip);
}

function handleClose() {
  visible.value = false;
  issuedResult.value = null;
  editingToken.value = null;
  toolDrawerVisible.value = false;
}

defineExpose({ open, showIssued });
</script>

<template>
  <div>
    <!-- 主模态框：全屏展示 (标准主体比例尺寸) -->
    <Modal
      v-model:open="visible"
      :title="
        issuedResult
          ? `🎉 ${issuedTitle}`
          : editingToken
            ? '编辑 Agent 访问凭据'
            : '新建 Agent 访问凭据'
      "
      width="100%"
      wrap-class-name="full-screen-agent-modal"
      :mask-closable="false"
      :footer="null"
      destroy-on-close
      @cancel="handleClose"
    >
      <!-- 创建成功展示结果页 -->
      <div v-if="issuedResult" class="max-w-5xl mx-auto py-3 space-y-4">
        <Alert
          type="warning"
          show-icon
          message="安全规范提示：请立即复制并妥善保管您的 Token 密钥"
          description="系统只保存 Token 摘要，关闭窗口后无法再次查看完整明文。若丢失，请执行 Token 轮换。"
        />

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <!-- 左侧：Token 独立卡片 (4 列) -->
          <div
            class="lg:col-span-4 p-4 bg-muted/40 rounded-xl border space-y-3 flex flex-col justify-between shadow-2xs"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span
                  class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Agent 专属 Token (API-Key)
                </span>
                <Tag
                  :color="
                    issuedResult.token.status === 'ACTIVE' ? 'green' : 'orange'
                  "
                >
                  {{
                    issuedResult.token.status === 'ACTIVE'
                      ? '已激活生效'
                      : '当前处于停用状态'
                  }}
                </Tag>
              </div>
              <div
                class="p-3 bg-background rounded-lg border font-mono text-xs break-all select-all leading-relaxed"
              >
                {{ issuedResult.plainToken }}
              </div>
              <p class="text-xs text-muted-foreground m-0">
                该密钥用于识别 Agent，调用范围受已选 MCP
                模块和所属用户权限共同约束。
              </p>
            </div>

            <Button
              type="primary"
              block
              @click="
                handleCopy(
                  issuedResult.plainToken,
                  'Token 密文已复制到剪贴板！',
                )
              "
            >
              复制 Token 密文
            </Button>
          </div>

          <!-- 右侧：标准 MCP 客户端连接配置 (8 列) -->
          <div
            class="lg:col-span-8 p-4 bg-card rounded-xl border space-y-3 shadow-2xs"
          >
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-foreground">
                  标准 MCP 客户端连接配置
                </span>
                <div class="text-xs text-muted-foreground mt-0.5">
                  Streamable HTTP 主协议，适用于 Cursor、Claude Code 等标准 MCP
                  客户端
                </div>
              </div>
              <Button
                size="small"
                type="primary"
                ghost
                class="shrink-0 text-xs"
                @click="
                  handleCopy(standardConfigJson, '标准 MCP 客户端配置已复制！')
                "
              >
                复制配置 JSON
              </Button>
            </div>

            <pre
              class="code-block m-0 p-3.5 bg-zinc-950 text-zinc-100 rounded-xl border border-zinc-800 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed select-all"
            ><code class="font-mono whitespace-pre leading-relaxed">{{ standardConfigJson }}</code></pre>

            <div
              class="flex items-center justify-between pt-2 border-t border-border/50"
            >
              <Alert
                type="info"
                show-icon
                message="配置中的 Authorization 请求头必须原样保留。"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-3 border-t">
          <Button type="primary" @click="handleClose">完成并返回列表</Button>
        </div>
      </div>

      <!-- 全屏创建表单 (按主体规范的标准控件比例) -->
      <div v-else class="max-w-4xl mx-auto py-2 space-y-4">
        <Form layout="vertical" class="space-y-4">
          <!-- 第 1 行：Agent 名称 -->
          <FormItem
            label="Agent 名称"
            required
            extra="例如：张三的 Cursor 数据探查助手 / 质量巡检智能体"
            class="mb-0"
          >
            <Input
              v-model:value="form.agentName"
              placeholder="请输入直观且易于识别的 Agent 名称"
              :maxlength="64"
            />
          </FormItem>

          <!-- 第 2 行：每日请求配额 + 有效期限 (两栏网格) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem
              label="每日请求配额 (次/天)"
              extra="达到每日配额后将自动拦截请求，次日 00:00 自动重置"
              class="mb-0"
            >
              <InputNumber
                v-model:value="form.maxDailyRequests"
                :min="10"
                :max="50000"
                :step="500"
                class="w-full"
              />
            </FormItem>

            <FormItem
              label="有效期限"
              extra="留空表示长期有效，到期后该凭据自动停用"
              class="mb-0"
            >
              <DatePicker
                v-model:value="form.expireTime"
                value-format="YYYY-MM-DD HH:mm:ss"
                show-time
                placeholder="请选择凭据过期时间（留空表示长期有效）"
                class="w-full"
              />
            </FormItem>
          </div>

          <!-- 第 3 行：用途说明 / 备注 -->
          <FormItem
            label="用途说明 / 备注"
            extra="简要说明此凭据绑定的本地客户端环境与使用目的"
            class="mb-0"
          >
            <Input.TextArea
              v-model:value="form.remark"
              placeholder="例如：用于个人本地 VSCode / Cursor 编写 SQL 时探查人口库表结构"
              :rows="2"
              :maxlength="200"
            />
          </FormItem>

          <!-- 第 4 行 / 第 5 行：MCP 领域模块授权与抽屉 Tools 查看 -->
          <div class="space-y-2.5 pt-1">
            <div class="flex items-center justify-between pb-1 border-b">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-foreground">
                    MCP 领域模块授权
                  </span>
                  <Tag color="blue" class="text-xs">
                    已勾选 {{ form.allowedCategories.length }} 个模块 / 包含
                    {{ totalSelectedToolsCount }} 个可用 Tools
                  </Tag>
                </div>
                <p class="text-xs text-muted-foreground m-0">
                  点击卡片切换勾选；点击<b>「查看 Tools 详情」</b>将从右侧滑出抽屉查看该模块内所有 Tools 的参数与约束。
                </p>
              </div>

              <Space size="small">
                <Button
                  type="link"
                  size="small"
                  class="text-xs p-0"
                  @click="selectAllCategories"
                >
                  全选所有模块
                </Button>
                <span class="text-muted-foreground/40">|</span>
                <Button
                  type="link"
                  size="small"
                  class="text-xs p-0 text-muted-foreground"
                  @click="clearAllExceptFirst"
                >
                  重置精简
                </Button>
              </Space>
            </div>

            <!-- 模块卡片响应式 3 列网格 -->
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1"
            >
              <div
                v-for="cat in categories"
                :key="cat.value"
                class="rounded-xl border p-3.5 cursor-pointer transition-all duration-200 flex flex-col justify-between select-none"
                :class="[
                  isSelected(cat.value)
                    ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/20 shadow-2xs'
                    : 'border-border/70 bg-card hover:border-muted-foreground/40 hover:bg-muted/10 opacity-80 hover:opacity-100',
                ]"
                @click="toggleCategory(cat.value)"
              >
                <!-- 卡片上部：勾选指示 + 模块名称 + 编码 + Tools 数量 -->
                <div class="space-y-1.5">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <!-- Checkbox 指示 -->
                      <div
                        class="w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0"
                        :class="
                          isSelected(cat.value)
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/40 bg-background'
                        "
                      >
                        <span
                          v-if="isSelected(cat.value)"
                          class="text-[10px] font-bold"
                          >✓</span>
                      </div>
                      <div>
                        <div class="font-bold text-xs text-foreground">
                          {{ cat.label }}
                        </div>
                        <div
                          class="text-[10px] text-muted-foreground font-mono"
                        >
                          {{ cat.code }}
                        </div>
                      </div>
                    </div>

                    <Tag
                      :color="isSelected(cat.value) ? 'blue' : 'default'"
                      class="text-[11px] font-medium m-0 shrink-0"
                    >
                      {{ cat.tools?.length ?? 0 }} Tools
                    </Tag>
                  </div>

                  <p
                    class="text-xs text-muted-foreground leading-relaxed m-0 line-clamp-2"
                  >
                    {{
                      CATEGORY_THEMES[cat.value]?.desc ||
                      '提供该领域的受控操作能力'
                    }}
                  </p>
                </div>

                <!-- 卡片底部：点击滑出 Tools 抽屉按钮 -->
                <div
                  class="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between"
                >
                  <span class="text-[11px] text-muted-foreground">
                    {{ isSelected(cat.value) ? '已授权该模块' : '未授权' }}
                  </span>
                  <Button
                    size="small"
                    type="link"
                    class="p-0 text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    @click="openCategoryToolDetails(cat, $event)"
                  >
                    查看 Tools 详情 🔍
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Form>

        <!-- 底部提交与取消按钮栏 -->
        <div class="flex items-center justify-between pt-4 border-t">
          <div class="text-xs text-muted-foreground">
            🛡️
            {{
              editingToken ? '保存后配置立即生效' : '凭据创建后立即生效'
            }}，Agent 的所有数据查询操作均严格遵循所属用户自身的 ABAC
            行级授权与动态脱敏约束。
          </div>
          <Space>
            <Button @click="handleClose">取消</Button>
            <Button type="primary" :loading="submitting" @click="handleSubmit">
              {{ editingToken ? '保存修改' : '确认生成专属凭据' }}
            </Button>
          </Space>
        </div>
      </div>
    </Modal>

    <!-- 侧边滑出抽屉：右侧呈现 Tools 深度元数据 -->
    <Drawer
      v-model:open="toolDrawerVisible"
      :title="`【${selectedCategoryForDetail?.label || ''}】包含的 MCP Tools 详细元数据`"
      :width="560"
      destroy-on-close
    >
      <div v-if="selectedCategoryForDetail" class="space-y-4 py-1">
        <div
          class="p-3 bg-muted/30 rounded-xl border flex items-center justify-between"
        >
          <div class="space-y-0.5">
            <div class="font-bold text-sm text-foreground">
              {{ selectedCategoryForDetail.label }} ({{
                selectedCategoryForDetail.code
              }})
            </div>
            <div class="text-xs text-muted-foreground">
              {{ CATEGORY_THEMES[selectedCategoryForDetail.value]?.desc }}
            </div>
          </div>
          <Tag color="blue" class="text-xs font-semibold">
            共 {{ selectedCategoryForDetail.tools?.length ?? 0 }} 个注册 Tools
          </Tag>
        </div>

        <ToolMetadataList :tools="selectedCategoryForDetail.tools" />
      </div>
    </Drawer>
  </div>
</template>

<style>
/* 全屏模态框样式 */
.full-screen-agent-modal {
  top: 0;
  max-width: 100vw;
  padding: 0;
}

.full-screen-agent-modal .ant-modal {
  top: 0;
  max-width: 100vw;
  padding-bottom: 0;
  margin: 0;
}

.full-screen-agent-modal .ant-modal-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 16px 28px;
  border-radius: 0;
}

.full-screen-agent-modal .ant-modal-body {
  flex: 1;
  padding: 8px 0 24px;
  overflow-y: auto;
}

.code-block {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  tab-size: 2;
  white-space: pre !important;
}
</style>
