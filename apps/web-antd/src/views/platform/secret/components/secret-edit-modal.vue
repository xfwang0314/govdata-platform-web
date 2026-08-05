<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type { ID } from '#/api/common';
import type {
  SecretOption,
  SecretOwnerModuleOption,
  SecretView,
} from '#/api/platform/secret/model';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Modal as AntModal, message, Tag } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  getSecretApi,
  getSecretOptionsApi,
  updateSecretApi,
} from '#/api/platform/secret';

const emit = defineEmits<{ success: [] }>();

const current = ref<null | SecretView>(null);
const typeOptions = ref<SecretOption[]>([]);
const ownerModules = ref<SecretOwnerModuleOption[]>([]);

const typeLabel = computed(
  () =>
    typeOptions.value.find((item) => item.value === current.value?.secretType)
      ?.label ??
    current.value?.secretType ??
    '-',
);

const ownerModuleLabel = computed(() => {
  const code = current.value?.ownerModule;
  return (
    ownerModules.value.find((item) => item.value === code)?.label ?? code ?? '-'
  );
});

function getAvailablePurposes(ownerModule?: string) {
  return (
    ownerModules.value.find((item) => item.value === ownerModule)?.purposes ??
    []
  );
}

function schema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { maxlength: 100, placeholder: '请输入凭据名称' },
      fieldName: 'secretName',
      label: '凭据名称',
      rules: 'required',
    },
    {
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        placeholder: '说明使用对象、责任边界或维护事项（选填）',
        rows: 3,
        showCount: true,
      },
      fieldName: 'description',
      formItemClass: 'col-span-full',
      label: '凭据描述',
    },
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: '不选择表示长期有效',
        showTime: true,
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      fieldName: 'expireTime',
      label: '到期时间',
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: [],
        placeholder: '请选择允许用途',
      },
      fieldName: 'purposeScope',
      formItemClass: 'col-span-full',
      help: '仅可选择当前所属模块支持登记的用途范围',
      label: '用途范围',
      rules: 'selectRequired',
    },
  ];
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'vertical',
  schema: schema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 gap-x-4',
});

async function reset() {
  current.value = null;
  await formApi.resetForm();
}

function confirmPurposeReduction() {
  return new Promise<boolean>((resolve) => {
    AntModal.confirm({
      cancelText: '取消',
      content:
        '移除用途后，依赖该用途的数据服务或交换任务可能无法继续读取凭据。',
      okText: '确认修改',
      okType: 'danger',
      onCancel: () => resolve(false),
      onOk: () => resolve(true),
      title: '确认缩小用途范围？',
    });
  });
}

async function handleConfirm() {
  if (!current.value) return;
  try {
    modalApi.lock(true);
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    const newPurposes: string[] = Array.isArray(values.purposeScope)
      ? values.purposeScope
      : String(values.purposeScope).split(',');

    const oldPurposes = current.value.purposeScope.split(',').filter(Boolean);

    // 检查是否有缩减用途范围
    const hasRemoved = oldPurposes.some((p) => !newPurposes.includes(p));

    if (hasRemoved) {
      const confirmed = await confirmPurposeReduction();
      if (!confirmed) {
        return;
      }
    }

    await updateSecretApi(current.value.secretId, {
      description: values.description?.trim() || null,
      expireTime: values.expireTime || null,
      lockVersion: current.value.lockVersion,
      purposeScope: newPurposes.join(','),
      secretName: values.secretName.trim(),
    });

    message.success('凭据元数据更新成功');
    emit('success');
    modalApi.close();
  } finally {
    modalApi.lock(false);
  }
}

const [EditModal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onClosed: reset,
  onConfirm: handleConfirm,
  async onOpenChange(open) {
    if (!open) return;
    modalApi.modalLoading(true);
    try {
      await reset();
      const data = modalApi.getData<{ record?: SecretView; secretId?: ID }>();
      if (!data?.record) {
        message.error('未找到待编辑的凭据信息');
        modalApi.close();
        return;
      }

      current.value = data.record;
      if (data.secretId) {
        try {
          current.value = await getSecretApi(data.secretId);
        } catch {
          // 查询权限和编辑权限可独立授予，查询失败时使用列表快照。
        }
      }

      const options = await getSecretOptionsApi();
      typeOptions.value = options.secretTypes;
      ownerModules.value = options.ownerModules;

      if (current.value) {
        const availablePurposes = getAvailablePurposes(
          current.value.ownerModule,
        );
        formApi.updateSchema([
          {
            componentProps: {
              mode: 'multiple',
              options: availablePurposes,
              placeholder: '请选择允许用途',
            },
            fieldName: 'purposeScope',
          },
        ]);
        await formApi.setValues({
          description: current.value.description,
          expireTime: current.value.expireTime,
          purposeScope: current.value.purposeScope.split(','),
          secretName: current.value.secretName,
        });
      }
    } catch {
      message.error('加载选项数据失败');
    } finally {
      modalApi.modalLoading(false);
    }
  },
});
</script>

<template>
  <EditModal
    :close-on-click-modal="false"
    class="w-[780px]"
    title="编辑凭据元数据"
  >
    <div class="space-y-6 py-1">
      <div
        v-if="current"
        class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="font-mono text-xs text-slate-500">
              凭据引用 (secretRef)
            </div>
            <div
              class="mt-0.5 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {{ current.secretRef }}
            </div>
          </div>
          <div class="flex gap-2">
            <Tag color="cyan">结构：{{ typeLabel }}</Tag>
            <Tag color="blue">模块：{{ ownerModuleLabel }}</Tag>
          </div>
        </div>
      </div>

      <Form />
    </div>
  </EditModal>
</template>
