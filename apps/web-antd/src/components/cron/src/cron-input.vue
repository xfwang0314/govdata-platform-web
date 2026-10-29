<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Button, Input, Select, Tag } from 'antdv-next';

import CronModal from './cron-modal.vue';
import { getNextRuns } from './cron-parser';

interface CronPreset {
  description: string;
  expression: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    placeholder?: string;
    value?: string;
  }>(),
  {
    disabled: false,
    placeholder: '例如：0 0 2 * * ?',
    value: '',
  },
);

const emit = defineEmits<{
  (e: 'update:value', val: string): void;
  (e: 'change', val: string): void;
}>();

const CRON_PRESETS: CronPreset[] = [
  {
    label: '每天凌晨 02:00 (推荐)',
    expression: '0 0 2 * * ?',
    description: '每天凌晨 2 点执行全量探查',
  },
  {
    label: '每天午夜 00:00',
    expression: '0 0 0 * * ?',
    description: '每天午夜 0 点执行',
  },
  {
    label: '每天中午 12:00',
    expression: '0 0 12 * * ?',
    description: '每天中午 12 点执行',
  },
  {
    label: '每小时整点',
    expression: '0 0 * * * ?',
    description: '每小时 0 分执行',
  },
  {
    label: '每 30 分钟',
    expression: '0 0/30 * * * ?',
    description: '每隔 30 分钟执行一次',
  },
  {
    label: '每周一凌晨 03:00',
    expression: '0 0 3 ? * MON',
    description: '每周一凌晨 3 点执行',
  },
  {
    label: '每月 1 号凌晨 02:00',
    expression: '0 0 2 1 * ?',
    description: '每月 1 号凌晨 2 点执行',
  },
  {
    label: '自定义表达式',
    expression: 'CUSTOM',
    description: '手动或可视化配置 Cron 表达式',
  },
];

const selectedPreset = ref<string>('0 0 2 * * ?');
const customExpression = ref<string>('');
const modalVisible = ref(false);

// 初始化与同步外部值
watch(
  () => props.value,
  (val) => {
    if (!val) {
      selectedPreset.value = '0 0 2 * * ?';
      customExpression.value = '';
      return;
    }
    const matched = CRON_PRESETS.find((p) => p.expression === val);
    if (matched) {
      selectedPreset.value = matched.expression;
      customExpression.value = '';
    } else {
      selectedPreset.value = 'CUSTOM';
      customExpression.value = val;
    }
  },
  { immediate: true },
);

const currentEffectiveExpression = computed(() => {
  if (selectedPreset.value !== 'CUSTOM') {
    return selectedPreset.value;
  }
  return customExpression.value.trim() || '0 0 2 * * ?';
});

const currentExplanation = computed(() => {
  const exp = currentEffectiveExpression.value;
  if (!exp) return '请输入标准的 5 或 6 段 Cron 表达式';
  const runs = getNextRuns(exp, 1);
  if (runs.length > 0) {
    return `下次执行预测: ${runs[0]}`;
  }
  return `当前表达式：${exp}`;
});

function handlePresetChange(rawVal: unknown) {
  const val = rawVal ? String(rawVal) : '0 0 2 * * ?';
  selectedPreset.value = val;
  if (val === 'CUSTOM') {
    const defaultCustom = customExpression.value || '0 0 2 * * ?';
    customExpression.value = defaultCustom;
    emit('update:value', defaultCustom);
    emit('change', defaultCustom);
  } else {
    emit('update:value', val);
    emit('change', val);
  }
}

function handleCustomInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const val = target.value;
  customExpression.value = val;
  emit('update:value', val);
  emit('change', val);
}

function openGeneratorModal() {
  modalVisible.value = true;
}

function handleModalOk(exp: string) {
  customExpression.value = exp;
  const matched = CRON_PRESETS.find((p) => p.expression === exp);
  selectedPreset.value = matched ? matched.expression : 'CUSTOM';
  emit('update:value', exp);
  emit('change', exp);
}
</script>

<template>
  <div class="space-y-1.5 w-full">
    <div class="flex flex-wrap items-center gap-2 w-full">
      <!-- 快捷预设下拉选择 -->
      <Select
        :value="selectedPreset"
        :disabled="disabled"
        :options="
          CRON_PRESETS.map((p) => ({
            label: `${p.label} (${p.expression === 'CUSTOM' ? '自定义/生成器配置' : p.expression})`,
            value: p.expression,
          }))
        "
        class="w-56 shrink-0"
        placeholder="选择周期预设"
        @update:value="handlePresetChange"
      />

      <!-- 自定义表达式输入框 -->
      <Input
        v-if="selectedPreset === 'CUSTOM'"
        :value="customExpression"
        :disabled="disabled"
        :placeholder="placeholder"
        class="flex-1 min-w-[140px] font-mono text-xs"
        allow-clear
        @input="handleCustomInput"
      />
      <div v-else class="flex items-center">
        <Tag color="blue" class="font-mono text-xs m-0">
          {{ selectedPreset }}
        </Tag>
      </div>

      <!-- 可视化生成器按钮 -->
      <Button
        type="primary"
        ghost
        size="small"
        :disabled="disabled"
        class="shrink-0 text-xs flex items-center gap-1 h-8 px-2.5 ml-auto sm:ml-0"
        @click="openGeneratorModal"
      >
        <span>⚙️ Cron生成器</span>
      </Button>
    </div>

    <!-- 周期说明辅助文本 -->
    <div
      class="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate"
    >
      <span
        class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
      ></span>
      <span class="truncate">{{ currentExplanation }}</span>
    </div>

    <!-- 公共 Cron 表达式生成器 Modal -->
    <CronModal
      v-model:open="modalVisible"
      :value="currentEffectiveExpression"
      @ok="handleModalOk"
    />
  </div>
</template>
