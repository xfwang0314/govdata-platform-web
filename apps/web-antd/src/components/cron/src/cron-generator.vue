<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import {
  Button,
  Input,
  InputNumber,
  Radio,
  RadioGroup,
  Select,
  TabPane,
  Tabs,
} from 'antdv-next';

import { getNextRuns } from './cron-parser';

const props = withDefaults(
  defineProps<{
    value?: string;
  }>(),
  {
    value: '0 0 2 * * ?',
  },
);

const emit = defineEmits<{
  (e: 'update:value', val: string): void;
  (e: 'change', val: string): void;
  (e: 'ok', val: string): void;
  (e: 'cancel'): void;
}>();

const activeTab = ref('second');

// 1. 秒
const secondType = ref('all');
const secondCycle = ref({ from: 0, to: 1 });
const secondLoop = ref({ start: 0, step: 1 });
const secondSpecific = ref<number[]>([0]);
const secondOptions = Array.from({ length: 60 }, (_, i) => ({
  label: `${i.toString().padStart(2, '0')}秒`,
  value: i,
}));

// 2. 分钟
const minuteType = ref('all');
const minuteCycle = ref({ from: 0, to: 1 });
const minuteLoop = ref({ start: 0, step: 1 });
const minuteSpecific = ref<number[]>([0]);
const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
  label: `${i.toString().padStart(2, '0')}分`,
  value: i,
}));

// 3. 小时
const hourType = ref('all');
const hourCycle = ref({ from: 0, to: 1 });
const hourLoop = ref({ start: 0, step: 1 });
const hourSpecific = ref<number[]>([2]);
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  label: `${i.toString().padStart(2, '0')}点`,
  value: i,
}));

// 4. 日
const dayType = ref('all');
const dayCycle = ref({ from: 1, to: 2 });
const dayLoop = ref({ start: 1, step: 1 });
const dayWork = ref(1);
const daySpecific = ref<number[]>([]);
const dayOptions = Array.from({ length: 31 }, (_, i) => ({
  label: `${(i + 1).toString().padStart(2, '0')}日`,
  value: i + 1,
}));

// 5. 月
const monthType = ref('all');
const monthCycle = ref({ from: 1, to: 2 });
const monthLoop = ref({ start: 1, step: 1 });
const monthSpecific = ref<number[]>([]);
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1}月`,
  value: i + 1,
}));

// 6. 周
const weekType = ref('unset');
const weekCycle = ref({ from: 1, to: 2 });
const weekLoop = ref({ start: 1, step: 1 });
const weekLast = ref(1);
const weekNth = ref({ nth: 1, week: 1 });
const weekSpecific = ref<number[]>([]);
const weekOptions = [
  { label: '周一 (MON)', value: 1 },
  { label: '周二 (TUE)', value: 2 },
  { label: '周三 (WED)', value: 3 },
  { label: '周四 (THU)', value: 4 },
  { label: '周五 (FRI)', value: 5 },
  { label: '周六 (SAT)', value: 6 },
  { label: '周日 (SUN)', value: 7 },
];

// 7. 年
const yearType = ref('empty');
const currentYear = new Date().getFullYear();
const yearCycle = ref({ from: currentYear, to: currentYear + 1 });

// 计算各个段的值
const secondVal = computed(() => {
  if (secondType.value === 'all') return '*';
  if (secondType.value === 'cycle')
    return `${secondCycle.value.from}-${secondCycle.value.to}`;
  if (secondType.value === 'loop')
    return `${secondLoop.value.start}/${secondLoop.value.step}`;
  if (secondType.value === 'specific') {
    return secondSpecific.value.length > 0
      ? secondSpecific.value.toSorted((a, b) => a - b).join(',')
      : '0';
  }
  return '*';
});

const minuteVal = computed(() => {
  if (minuteType.value === 'all') return '*';
  if (minuteType.value === 'cycle')
    return `${minuteCycle.value.from}-${minuteCycle.value.to}`;
  if (minuteType.value === 'loop')
    return `${minuteLoop.value.start}/${minuteLoop.value.step}`;
  if (minuteType.value === 'specific') {
    return minuteSpecific.value.length > 0
      ? minuteSpecific.value.toSorted((a, b) => a - b).join(',')
      : '0';
  }
  return '*';
});

const hourVal = computed(() => {
  if (hourType.value === 'all') return '*';
  if (hourType.value === 'cycle')
    return `${hourCycle.value.from}-${hourCycle.value.to}`;
  if (hourType.value === 'loop')
    return `${hourLoop.value.start}/${hourLoop.value.step}`;
  if (hourType.value === 'specific') {
    return hourSpecific.value.length > 0
      ? hourSpecific.value.toSorted((a, b) => a - b).join(',')
      : '0';
  }
  return '*';
});

const dayVal = computed(() => {
  if (dayType.value === 'unset') return '?';
  if (dayType.value === 'all') return '*';
  if (dayType.value === 'cycle')
    return `${dayCycle.value.from}-${dayCycle.value.to}`;
  if (dayType.value === 'loop')
    return `${dayLoop.value.start}/${dayLoop.value.step}`;
  if (dayType.value === 'last') return 'L';
  if (dayType.value === 'lastWork') return 'LW';
  if (dayType.value === 'work') return `${dayWork.value}W`;
  if (dayType.value === 'specific') {
    return daySpecific.value.length > 0
      ? daySpecific.value.toSorted((a, b) => a - b).join(',')
      : '1';
  }
  return '*';
});

const monthVal = computed(() => {
  if (monthType.value === 'unset') return '?';
  if (monthType.value === 'all') return '*';
  if (monthType.value === 'cycle')
    return `${monthCycle.value.from}-${monthCycle.value.to}`;
  if (monthType.value === 'loop')
    return `${monthLoop.value.start}/${monthLoop.value.step}`;
  if (monthType.value === 'specific') {
    return monthSpecific.value.length > 0
      ? monthSpecific.value.toSorted((a, b) => a - b).join(',')
      : '1';
  }
  return '*';
});

const weekVal = computed(() => {
  if (weekType.value === 'unset') return '?';
  if (weekType.value === 'all') return '*';
  if (weekType.value === 'cycle')
    return `${weekCycle.value.from}-${weekCycle.value.to}`;
  if (weekType.value === 'loop')
    return `${weekLoop.value.start}/${weekLoop.value.step}`;
  if (weekType.value === 'last') return `${weekLast.value}L`;
  if (weekType.value === 'nth')
    return `${weekNth.value.week}#${weekNth.value.nth}`;
  if (weekType.value === 'specific') {
    return weekSpecific.value.length > 0
      ? weekSpecific.value.toSorted((a, b) => a - b).join(',')
      : '?';
  }
  return '?';
});

const yearVal = computed(() => {
  if (yearType.value === 'empty') return '';
  if (yearType.value === 'all') return '*';
  if (yearType.value === 'cycle')
    return `${yearCycle.value.from}-${yearCycle.value.to}`;
  return '';
});

// 生成完整 Cron 表达式
const generatedExpression = computed(() => {
  let d = dayVal.value;
  let w = weekVal.value;
  // 日与周互斥
  if (d !== '?' && w !== '?') {
    if (dayType.value === 'unset') {
      d = '?';
    } else {
      w = '?';
    }
  }
  const main = `${secondVal.value} ${minuteVal.value} ${hourVal.value} ${d} ${monthVal.value} ${w}`;
  return yearVal.value ? `${main} ${yearVal.value}` : main;
});

const currentExpression = ref(props.value || '0 0 2 * * ?');

watch(generatedExpression, (val) => {
  currentExpression.value = val;
  emit('update:value', val);
  emit('change', val);
});

// 计算最近 5 次执行时间
const nextFiveRuns = computed(() => {
  return getNextRuns(currentExpression.value, 5);
});

function parseCron(exp: string) {
  if (!exp) return;
  const parts = exp.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 7) return;

  const [s = '0', m = '0', h = '0', d = '*', M = '*', w = '?', y = ''] =
    parts.length === 5 ? ['0', ...parts, ''] : parts;

  // 秒
  if (s === '*') secondType.value = 'all';
  else if (s.includes('/')) {
    secondType.value = 'loop';
    const [start, step] = s.split('/');
    secondLoop.value = { start: Number(start) || 0, step: Number(step) || 1 };
  } else if (s.includes('-')) {
    secondType.value = 'cycle';
    const [from, to] = s.split('-');
    secondCycle.value = { from: Number(from) || 0, to: Number(to) || 1 };
  } else {
    secondType.value = 'specific';
    secondSpecific.value = s
      .split(',')
      .map(Number)
      .filter((n) => !Number.isNaN(n));
  }

  // 分
  if (m === '*') minuteType.value = 'all';
  else if (m.includes('/')) {
    minuteType.value = 'loop';
    const [start, step] = m.split('/');
    minuteLoop.value = { start: Number(start) || 0, step: Number(step) || 1 };
  } else if (m.includes('-')) {
    minuteType.value = 'cycle';
    const [from, to] = m.split('-');
    minuteCycle.value = { from: Number(from) || 0, to: Number(to) || 1 };
  } else {
    minuteType.value = 'specific';
    minuteSpecific.value = m
      .split(',')
      .map(Number)
      .filter((n) => !Number.isNaN(n));
  }

  // 时
  if (h === '*') hourType.value = 'all';
  else if (h.includes('/')) {
    hourType.value = 'loop';
    const [start, step] = h.split('/');
    hourLoop.value = { start: Number(start) || 0, step: Number(step) || 1 };
  } else if (h.includes('-')) {
    hourType.value = 'cycle';
    const [from, to] = h.split('-');
    hourCycle.value = { from: Number(from) || 0, to: Number(to) || 1 };
  } else {
    hourType.value = 'specific';
    hourSpecific.value = h
      .split(',')
      .map(Number)
      .filter((n) => !Number.isNaN(n));
  }

  // 日
  switch (d) {
    case '*': {
      dayType.value = 'all';
      break;
    }
    case '?': {
      dayType.value = 'unset';
      break;
    }
    case 'L': {
      dayType.value = 'last';
      break;
    }
    case 'LW': {
      dayType.value = 'lastWork';
      break;
    }
    default: {
      if (d.endsWith('W')) {
        dayType.value = 'work';
        dayWork.value = Number.parseInt(d, 10) || 1;
      } else if (d.includes('/')) {
        dayType.value = 'loop';
        const [start, step] = d.split('/');
        dayLoop.value = { start: Number(start) || 1, step: Number(step) || 1 };
      } else if (d.includes('-')) {
        dayType.value = 'cycle';
        const [from, to] = d.split('-');
        dayCycle.value = { from: Number(from) || 1, to: Number(to) || 2 };
      } else {
        dayType.value = 'specific';
        daySpecific.value = d
          .split(',')
          .map(Number)
          .filter((n) => !Number.isNaN(n));
      }
    }
  }

  // 月
  if (M === '?') monthType.value = 'unset';
  else if (M === '*') monthType.value = 'all';
  else if (M.includes('/')) {
    monthType.value = 'loop';
    const [start, step] = M.split('/');
    monthLoop.value = { start: Number(start) || 1, step: Number(step) || 1 };
  } else if (M.includes('-')) {
    monthType.value = 'cycle';
    const [from, to] = M.split('-');
    monthCycle.value = { from: Number(from) || 1, to: Number(to) || 2 };
  } else {
    monthType.value = 'specific';
    monthSpecific.value = M.split(',')
      .map(Number)
      .filter((n) => !Number.isNaN(n));
  }

  // 周
  if (w === '?') weekType.value = 'unset';
  else if (w === '*') weekType.value = 'all';
  else if (w.endsWith('L')) {
    weekType.value = 'last';
    weekLast.value = Number.parseInt(w, 10) || 1;
  } else if (w.includes('#')) {
    weekType.value = 'nth';
    const [week, nth] = w.split('#');
    weekNth.value = { nth: Number(nth) || 1, week: Number(week) || 1 };
  } else if (w.includes('/')) {
    weekType.value = 'loop';
    const [start, step] = w.split('/');
    weekLoop.value = { start: Number(start) || 1, step: Number(step) || 1 };
  } else if (w.includes('-')) {
    weekType.value = 'cycle';
    const [from, to] = w.split('-');
    weekCycle.value = { from: Number(from) || 1, to: Number(to) || 2 };
  } else {
    weekType.value = 'specific';
    weekSpecific.value = w
      .split(',')
      .map(Number)
      .filter((n) => !Number.isNaN(n));
  }

  // 年
  if (!y || y === '') yearType.value = 'empty';
  else if (y === '*') yearType.value = 'all';
  else if (y.includes('-')) {
    yearType.value = 'cycle';
    const [from, to] = y.split('-');
    yearCycle.value = {
      from: Number(from) || currentYear,
      to: Number(to) || currentYear + 1,
    };
  }
}

watch(
  () => props.value,
  (val) => {
    if (val && val !== currentExpression.value) {
      currentExpression.value = val;
      parseCron(val);
    }
  },
  { immediate: true },
);

function reset() {
  currentExpression.value = '0 0 2 * * ?';
  parseCron('0 0 2 * * ?');
  emit('update:value', '0 0 2 * * ?');
  emit('change', '0 0 2 * * ?');
}

function handleOk() {
  emit('ok', currentExpression.value);
}

function handleCancel() {
  emit('cancel');
}
</script>

<template>
  <div class="space-y-4">
    <!-- 1. 顶部 7 大维度选项卡 -->
    <Tabs v-model:active-key="activeTab" type="card" size="small">
      <!-- 秒 -->
      <TabPane key="second" tab="秒">
        <div class="p-3 bg-card rounded-lg border border-border/40 text-xs">
          <RadioGroup
            v-model:value="secondType"
            class="space-y-3 flex flex-col"
          >
            <Radio value="all">秒，允许的通配符[, - * /]</Radio>
            <Radio value="cycle">
              <span class="inline-flex items-center gap-2">
                周期从
                <InputNumber
                  v-model:value="secondCycle.from"
                  size="small"
                  :min="0"
                  :max="58"
                  class="w-16"
                />
                -
                <InputNumber
                  v-model:value="secondCycle.to"
                  size="small"
                  :min="1"
                  :max="59"
                  class="w-16"
                />
                秒
              </span>
            </Radio>
            <Radio value="loop">
              <span class="inline-flex items-center gap-2">
                从
                <InputNumber
                  v-model:value="secondLoop.start"
                  size="small"
                  :min="0"
                  :max="59"
                  class="w-16"
                />
                秒开始，每
                <InputNumber
                  v-model:value="secondLoop.step"
                  size="small"
                  :min="1"
                  :max="59"
                  class="w-16"
                />
                秒执行一次
              </span>
            </Radio>
            <Radio value="specific">
              <div class="inline-flex items-center gap-2 w-full">
                <span>指定</span>
                <Select
                  v-model:value="secondSpecific"
                  mode="multiple"
                  size="small"
                  :options="secondOptions"
                  placeholder="可多选秒数"
                  class="flex-1 min-w-[280px]"
                />
              </div>
            </Radio>
          </RadioGroup>
        </div>
      </TabPane>

      <!-- 分钟 -->
      <TabPane key="minute" tab="分钟">
        <div class="p-3 bg-card rounded-lg border border-border/40 text-xs">
          <RadioGroup
            v-model:value="minuteType"
            class="space-y-3 flex flex-col"
          >
            <Radio value="all">分钟，允许的通配符[, - * /]</Radio>
            <Radio value="cycle">
              <span class="inline-flex items-center gap-2">
                周期从
                <InputNumber
                  v-model:value="minuteCycle.from"
                  size="small"
                  :min="0"
                  :max="58"
                  class="w-16"
                />
                -
                <InputNumber
                  v-model:value="minuteCycle.to"
                  size="small"
                  :min="1"
                  :max="59"
                  class="w-16"
                />
                分钟
              </span>
            </Radio>
            <Radio value="loop">
              <span class="inline-flex items-center gap-2">
                从
                <InputNumber
                  v-model:value="minuteLoop.start"
                  size="small"
                  :min="0"
                  :max="59"
                  class="w-16"
                />
                分开始，每
                <InputNumber
                  v-model:value="minuteLoop.step"
                  size="small"
                  :min="1"
                  :max="59"
                  class="w-16"
                />
                分执行一次
              </span>
            </Radio>
            <Radio value="specific">
              <div class="inline-flex items-center gap-2 w-full">
                <span>指定</span>
                <Select
                  v-model:value="minuteSpecific"
                  mode="multiple"
                  size="small"
                  :options="minuteOptions"
                  placeholder="可多选分钟"
                  class="flex-1 min-w-[280px]"
                />
              </div>
            </Radio>
          </RadioGroup>
        </div>
      </TabPane>

      <!-- 小时 -->
      <TabPane key="hour" tab="小时">
        <div class="p-3 bg-card rounded-lg border border-border/40 text-xs">
          <RadioGroup v-model:value="hourType" class="space-y-3 flex flex-col">
            <Radio value="all">小时，允许的通配符[, - * /]</Radio>
            <Radio value="cycle">
              <span class="inline-flex items-center gap-2">
                周期从
                <InputNumber
                  v-model:value="hourCycle.from"
                  size="small"
                  :min="0"
                  :max="22"
                  class="w-16"
                />
                -
                <InputNumber
                  v-model:value="hourCycle.to"
                  size="small"
                  :min="1"
                  :max="23"
                  class="w-16"
                />
                小时
              </span>
            </Radio>
            <Radio value="loop">
              <span class="inline-flex items-center gap-2">
                从
                <InputNumber
                  v-model:value="hourLoop.start"
                  size="small"
                  :min="0"
                  :max="23"
                  class="w-16"
                />
                小时开始，每
                <InputNumber
                  v-model:value="hourLoop.step"
                  size="small"
                  :min="1"
                  :max="23"
                  class="w-16"
                />
                小时执行一次
              </span>
            </Radio>
            <Radio value="specific">
              <div class="inline-flex items-center gap-2 w-full">
                <span>指定</span>
                <Select
                  v-model:value="hourSpecific"
                  mode="multiple"
                  size="small"
                  :options="hourOptions"
                  placeholder="可多选小时"
                  class="flex-1 min-w-[280px]"
                />
              </div>
            </Radio>
          </RadioGroup>
        </div>
      </TabPane>

      <!-- 日 -->
      <TabPane key="day" tab="日">
        <div class="p-3 bg-card rounded-lg border border-border/40 text-xs">
          <RadioGroup v-model:value="dayType" class="space-y-3 flex flex-col">
            <Radio value="all">日，允许的通配符[, - * / ? L W]</Radio>
            <Radio value="unset">不指定</Radio>
            <Radio value="cycle">
              <span class="inline-flex items-center gap-2">
                周期从
                <InputNumber
                  v-model:value="dayCycle.from"
                  size="small"
                  :min="1"
                  :max="30"
                  class="w-16"
                />
                -
                <InputNumber
                  v-model:value="dayCycle.to"
                  size="small"
                  :min="2"
                  :max="31"
                  class="w-16"
                />
                日
              </span>
            </Radio>
            <Radio value="loop">
              <span class="inline-flex items-center gap-2">
                从
                <InputNumber
                  v-model:value="dayLoop.start"
                  size="small"
                  :min="1"
                  :max="31"
                  class="w-16"
                />
                日开始，每
                <InputNumber
                  v-model:value="dayLoop.step"
                  size="small"
                  :min="1"
                  :max="31"
                  class="w-16"
                />
                日执行一次
              </span>
            </Radio>
            <Radio value="work">
              <span class="inline-flex items-center gap-2">
                每月
                <InputNumber
                  v-model:value="dayWork"
                  size="small"
                  :min="1"
                  :max="31"
                  class="w-16"
                />
                号最近的那个工作日
              </span>
            </Radio>
            <Radio value="last">本月最后一天</Radio>
            <Radio value="lastWork">本月最后一个工作日</Radio>
            <Radio value="specific">
              <div class="inline-flex items-center gap-2 w-full">
                <span>指定</span>
                <Select
                  v-model:value="daySpecific"
                  mode="multiple"
                  size="small"
                  :options="dayOptions"
                  placeholder="可多选日期"
                  class="flex-1 min-w-[280px]"
                />
              </div>
            </Radio>
          </RadioGroup>
        </div>
      </TabPane>

      <!-- 月 -->
      <TabPane key="month" tab="月">
        <div class="p-3 bg-card rounded-lg border border-border/40 text-xs">
          <RadioGroup v-model:value="monthType" class="space-y-3 flex flex-col">
            <Radio value="all">月，允许的通配符[, - * /]</Radio>
            <Radio value="unset">不指定</Radio>
            <Radio value="cycle">
              <span class="inline-flex items-center gap-2">
                周期从
                <InputNumber
                  v-model:value="monthCycle.from"
                  size="small"
                  :min="1"
                  :max="11"
                  class="w-16"
                />
                -
                <InputNumber
                  v-model:value="monthCycle.to"
                  size="small"
                  :min="2"
                  :max="12"
                  class="w-16"
                />
                月
              </span>
            </Radio>
            <Radio value="loop">
              <span class="inline-flex items-center gap-2">
                从
                <InputNumber
                  v-model:value="monthLoop.start"
                  size="small"
                  :min="1"
                  :max="12"
                  class="w-16"
                />
                月开始，每
                <InputNumber
                  v-model:value="monthLoop.step"
                  size="small"
                  :min="1"
                  :max="12"
                  class="w-16"
                />
                月执行一次
              </span>
            </Radio>
            <Radio value="specific">
              <div class="inline-flex items-center gap-2 w-full">
                <span>指定</span>
                <Select
                  v-model:value="monthSpecific"
                  mode="multiple"
                  size="small"
                  :options="monthOptions"
                  placeholder="可多选月份"
                  class="flex-1 min-w-[280px]"
                />
              </div>
            </Radio>
          </RadioGroup>
        </div>
      </TabPane>

      <!-- 周 -->
      <TabPane key="week" tab="周">
        <div class="p-3 bg-card rounded-lg border border-border/40 text-xs">
          <RadioGroup v-model:value="weekType" class="space-y-3 flex flex-col">
            <Radio value="all">周，允许的通配符[, - * / ? L #]</Radio>
            <Radio value="unset">不指定</Radio>
            <Radio value="cycle">
              <span class="inline-flex items-center gap-2">
                周期从星期
                <Select
                  v-model:value="weekCycle.from"
                  size="small"
                  :options="weekOptions"
                  class="w-28"
                />
                -
                <Select
                  v-model:value="weekCycle.to"
                  size="small"
                  :options="weekOptions"
                  class="w-28"
                />
              </span>
            </Radio>
            <Radio value="loop">
              <span class="inline-flex items-center gap-2">
                从星期
                <Select
                  v-model:value="weekLoop.start"
                  size="small"
                  :options="weekOptions"
                  class="w-28"
                />
                开始，每
                <InputNumber
                  v-model:value="weekLoop.step"
                  size="small"
                  :min="1"
                  :max="7"
                  class="w-16"
                />
                天执行一次
              </span>
            </Radio>
            <Radio value="nth">
              <span class="inline-flex items-center gap-2">
                第
                <InputNumber
                  v-model:value="weekNth.nth"
                  size="small"
                  :min="1"
                  :max="5"
                  class="w-16"
                />
                周的星期
                <Select
                  v-model:value="weekNth.week"
                  size="small"
                  :options="weekOptions"
                  class="w-28"
                />
              </span>
            </Radio>
            <Radio value="last">
              <span class="inline-flex items-center gap-2">
                本月最后一个星期
                <Select
                  v-model:value="weekLast"
                  size="small"
                  :options="weekOptions"
                  class="w-28"
                />
              </span>
            </Radio>
            <Radio value="specific">
              <div class="inline-flex items-center gap-2 w-full">
                <span>指定</span>
                <Select
                  v-model:value="weekSpecific"
                  mode="multiple"
                  size="small"
                  :options="weekOptions"
                  placeholder="可多选星期"
                  class="flex-1 min-w-[280px]"
                />
              </div>
            </Radio>
          </RadioGroup>
        </div>
      </TabPane>

      <!-- 年 -->
      <TabPane key="year" tab="年">
        <div class="p-3 bg-card rounded-lg border border-border/40 text-xs">
          <RadioGroup v-model:value="yearType" class="space-y-3 flex flex-col">
            <Radio value="empty">不填写，允许的通配符[, - * /] 留空</Radio>
            <Radio value="all">每年</Radio>
            <Radio value="cycle">
              <span class="inline-flex items-center gap-2">
                周期从
                <InputNumber
                  v-model:value="yearCycle.from"
                  size="small"
                  :min="2020"
                  :max="2099"
                  class="w-24"
                />
                -
                <InputNumber
                  v-model:value="yearCycle.to"
                  size="small"
                  :min="2020"
                  :max="2099"
                  class="w-24"
                />
                年
              </span>
            </Radio>
          </RadioGroup>
        </div>
      </TabPane>
    </Tabs>

    <!-- 2. 中间时间表达式表格 -->
    <div class="rounded-lg border border-border/60 p-3 bg-card space-y-2">
      <div
        class="text-center text-xs font-semibold text-muted-foreground relative"
      >
        <span class="bg-card px-3 relative z-10">时间表达式</span>
        <div class="absolute top-1/2 left-0 right-0 h-px bg-border/50"></div>
      </div>

      <div class="grid grid-cols-12 gap-1.5 text-center text-xs pt-1">
        <div class="col-span-1">
          <div class="text-[11px] text-muted-foreground mb-1">秒</div>
          <Input
            :value="secondVal"
            readonly
            class="text-center font-mono text-xs px-1"
          />
        </div>
        <div class="col-span-1">
          <div class="text-[11px] text-muted-foreground mb-1">分钟</div>
          <Input
            :value="minuteVal"
            readonly
            class="text-center font-mono text-xs px-1"
          />
        </div>
        <div class="col-span-1">
          <div class="text-[11px] text-muted-foreground mb-1">小时</div>
          <Input
            :value="hourVal"
            readonly
            class="text-center font-mono text-xs px-1"
          />
        </div>
        <div class="col-span-1">
          <div class="text-[11px] text-muted-foreground mb-1">日</div>
          <Input
            :value="dayVal"
            readonly
            class="text-center font-mono text-xs px-1"
          />
        </div>
        <div class="col-span-1">
          <div class="text-[11px] text-muted-foreground mb-1">月</div>
          <Input
            :value="monthVal"
            readonly
            class="text-center font-mono text-xs px-1"
          />
        </div>
        <div class="col-span-1">
          <div class="text-[11px] text-muted-foreground mb-1">周</div>
          <Input
            :value="weekVal"
            readonly
            class="text-center font-mono text-xs px-1"
          />
        </div>
        <div class="col-span-1">
          <div class="text-[11px] text-muted-foreground mb-1">年</div>
          <Input
            :value="yearVal"
            readonly
            class="text-center font-mono text-xs px-1"
            placeholder="留空"
          />
        </div>
        <div class="col-span-5">
          <div
            class="text-[11px] text-muted-foreground mb-1 font-semibold text-foreground"
          >
            Cron 表达式
          </div>
          <Input
            :value="currentExpression"
            class="font-mono text-xs font-bold text-primary text-center"
            @input="
              (e: any) => {
                currentExpression = e.target.value;
                parseCron(e.target.value);
              }
            "
          />
        </div>
      </div>
    </div>

    <!-- 3. 下方最近 5 次运行时间展示 -->
    <div class="rounded-lg border border-border/60 p-3 bg-muted/10 space-y-2">
      <div class="text-xs font-semibold text-foreground">最近5次运行时间</div>
      <div v-if="nextFiveRuns.length > 0" class="space-y-1 pl-3">
        <div
          v-for="(time, idx) in nextFiveRuns"
          :key="idx"
          class="text-xs font-mono text-foreground/90 flex items-center gap-2"
        >
          <span
            class="inline-block w-1.5 h-1.5 rounded-full bg-primary/70"
          ></span>
          <span>{{ time }}</span>
        </div>
      </div>
      <div v-else class="text-xs text-amber-500 font-medium py-1">
        ⚠️ 无法解析出未来的有效调度时间，请检查表达式配置
      </div>
    </div>

    <!-- 4. 底部按钮 -->
    <div class="flex items-center justify-center gap-3 pt-1">
      <Button type="primary" class="w-20 text-xs" @click="handleOk">
        确定
      </Button>
      <Button
        class="w-20 text-xs bg-amber-500 hover:bg-amber-600 text-white border-none"
        @click="reset"
      >
        重置
      </Button>
      <Button class="w-20 text-xs" @click="handleCancel"> 取消 </Button>
    </div>
  </div>
</template>
