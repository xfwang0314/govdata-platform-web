<script setup lang="tsx">
import type { DescriptionsProps } from 'antdv-next';

import type { ID } from '#/api/common';
import type {
  SecretOwnerModuleOption,
  SecretView,
} from '#/api/platform/secret/model';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Descriptions, Tag, TypographyText } from 'antdv-next';

import { getSecretApi, getSecretOptionsApi } from '#/api/platform/secret';

const current = ref<null | SecretView>(null);
const typeOptions = ref<{ label: string; value: string }[]>([]);
const ownerModules = ref<SecretOwnerModuleOption[]>([]);

const typeLabel = computed(
  () =>
    typeOptions.value.find((item) => item.value === current.value?.secretType)
      ?.label ?? current.value?.secretType ?? '-',
);

const ownerModuleLabel = computed(() => {
  const code = current.value?.ownerModule;
  return (
    ownerModules.value.find((item) => item.value === code)?.label ??
    code ??
    '-'
  );
});

const purposeList = computed(() => {
  if (!current.value?.purposeScope) return [];
  const moduleConfig = ownerModules.value.find(
    (item) => item.value === current.value?.ownerModule,
  );
  return current.value.purposeScope.split(',').map((code) => {
    const found = moduleConfig?.purposes.find((p) => p.value === code);
    return {
      code,
      label: found?.label ?? code,
    };
  });
});

const isExpired = computed(() => {
  if (!current.value?.expireTime) return false;
  return (
    new Date(current.value.expireTime.replace(' ', 'T')).getTime() < Date.now()
  );
});

const items = computed<DescriptionsProps['items']>(() => {
  if (!current.value) return [];
  return [
    {
      content: (
        <Tag color={current.value.status === 'ACTIVE' ? 'success' : 'default'}>
          {current.value.status === 'ACTIVE' ? '正常' : '已停用'}
        </Tag>
      ),
      label: '状态',
    },
    {
      content: (
        <span class="font-mono font-semibold">
          v{current.value.currentVersionNo}
        </span>
      ),
      label: '当前版本',
    },
    {
      content: <Tag color="cyan">{typeLabel.value}</Tag>,
      label: '凭据结构',
    },
    {
      content: <Tag color="blue">{ownerModuleLabel.value}</Tag>,
      label: '所属模块',
    },
    {
      content: (
        <span class="wrap-break-word whitespace-pre-wrap text-slate-600 dark:text-slate-300">
          {current.value.description || '暂无描述'}
        </span>
      ),
      label: '凭据描述',
      span: 2,
    },
    {
      content: (
        <div class="flex items-center gap-2">
          <span>{current.value.expireTime || '长期有效'}</span>
          {isExpired.value && <Tag color="error">已过期</Tag>}
        </div>
      ),
      label: '到期时间',
    },
    {
      content: (
        <span class="font-mono text-xs">
          {current.value.configured ? '配置完整' : '草稿状态'}
        </span>
      ),
      label: '配置状态',
    },
    {
      content: (
        <div class="flex flex-col gap-1.5 py-1">
          {purposeList.value.map((item) => (
            <div class="flex items-center gap-2" key={item.code}>
              <Tag class="m-0" color="blue">
                {item.label}
              </Tag>
              <span class="font-mono text-xs text-slate-400">({item.code})</span>
            </div>
          ))}
        </div>
      ),
      label: '用途范围',
      span: 2,
    },
    {
      content: current.value.createTime || '-',
      label: '创建时间',
    },
    {
      content: current.value.updateTime || '-',
      label: '更新时间',
    },
  ];
});

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange: async (open) => {
    if (!open) {
      current.value = null;
      return;
    }
    const data = drawerApi.getData<{ record?: SecretView; secretId?: ID }>();
    if (data?.record) {
      current.value = data.record;
    }
    drawerApi.drawerLoading(true);
    try {
      const options = await getSecretOptionsApi();
      typeOptions.value = options.secretTypes;
      ownerModules.value = options.ownerModules;

      if (data?.secretId) {
        current.value = await getSecretApi(data.secretId);
      }
    } finally {
      drawerApi.drawerLoading(false);
    }
  },
});
</script>

<template>
  <Drawer :footer="false" class="w-[600px]" title="凭据详情">
    <div v-if="current" class="flex flex-col gap-5">
      <!-- 头部 Hero 卡片 -->
      <div
        class="rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-teal-50/30 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-teal-950/20"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              viewBox="0 0 24 24"
            >
              <path
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h3
              class="truncate text-base font-bold text-slate-900 dark:text-slate-100"
            >
              {{ current.secretName }}
            </h3>
            <div class="mt-1 flex items-center gap-2">
              <TypographyText
                :copyable="{ text: current.secretRef }"
                class="font-mono text-xs !text-slate-500 dark:!text-slate-400"
              >
                {{ current.secretRef }}
              </TypographyText>
            </div>
          </div>
        </div>
      </div>

      <!-- 核心属性属性列表 -->
      <Descriptions :column="2" :items="items" bordered size="small" />
    </div>
  </Drawer>
</template>
