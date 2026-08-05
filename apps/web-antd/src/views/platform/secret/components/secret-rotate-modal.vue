<script setup lang="ts">
import type { ID } from '#/api/common';
import type { SecretView } from '#/api/platform/secret/model';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert, message, Tag } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getSecretApi, rotateSecretApi } from '#/api/platform/secret';

import SecretValuesEditor from './secret-values-editor.vue';

interface ValuesEditorApi {
  getValues: () => Record<string, string>;
  reset: () => void;
  validate: () => { message?: string; valid: boolean };
}

const emit = defineEmits<{ success: [] }>();

const current = ref<null | SecretView>(null);
const valuesEditorRef = ref<null | ValuesEditorApi>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'vertical',
  schema: [
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: '不选择表示长期有效',
        showTime: true,
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      fieldName: 'expireTime',
      label: '新到期时间',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 gap-x-4',
});

async function reset() {
  current.value = null;
  await formApi.resetForm();
  valuesEditorRef.value?.reset();
}

async function handleConfirm() {
  if (!current.value) return;
  try {
    modalApi.lock(true);
    const { valid } = await formApi.validate();
    if (!valid) return;

    const secretValidation = valuesEditorRef.value?.validate();
    if (!secretValidation?.valid) {
      message.warning(secretValidation?.message ?? '请填写新版本敏感值');
      return;
    }

    const values = await formApi.getValues();
    await rotateSecretApi(current.value.secretId, {
      expireTime: values.expireTime || null,
      lockVersion: current.value.lockVersion,
      values: valuesEditorRef.value?.getValues() ?? {},
    });

    message.success('凭据轮换成功，新版本已生效');
    emit('success');
    modalApi.close();
  } finally {
    modalApi.lock(false);
  }
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onClosed: reset,
  onConfirm: handleConfirm,
  async onOpenChange(open) {
    if (!open) return;
    modalApi.modalLoading(true);
    try {
      await reset();
      const data = modalApi.getData<{
        record?: SecretView;
        secretId?: ID;
      }>();
      if (!data?.record) {
        message.error('未找到待轮换的凭据信息');
        modalApi.close();
        return;
      }

      current.value = data.record;
      if (data.secretId) {
        try {
          current.value = await getSecretApi(data.secretId);
        } catch {
          // 查询权限和轮换权限可独立授予，查询失败时使用列表快照。
        }
      }
      await formApi.setValues({
        expireTime: current.value.expireTime,
      });
    } finally {
      modalApi.modalLoading(false);
    }
  },
});
</script>

<template>
  <Modal :close-on-click-modal="false" class="w-[720px]" title="轮换凭据">
    <div class="space-y-6 py-1">
      <div
        v-if="current"
        class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-semibold text-slate-900 dark:text-slate-100">
              {{ current.secretName }}
            </div>
            <div class="mt-1 font-mono text-xs text-slate-500">
              {{ current.secretRef }}
            </div>
          </div>
          <Tag color="blue">当前版本 v{{ current.currentVersionNo }}</Tag>
        </div>
      </div>

      <Alert
        class="my-1"
        message="轮换后将立即启用新版本，旧值不可查看或恢复。"
        show-icon
        type="warning"
      />

      <Form />

      <section>
        <div class="mb-2 flex items-center gap-2">
          <span class="text-sm font-semibold">新版本敏感值</span>
          <Tag color="gold">不读取旧值</Tag>
        </div>
        <SecretValuesEditor
          ref="valuesEditorRef"
          :secret-type="current?.secretType"
        />
      </section>
    </div>
  </Modal>
</template>
