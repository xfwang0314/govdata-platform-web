<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type {
  SecretOwnerModuleOption,
  SecretType,
  SecretTypeOption,
} from '#/api/platform/secret/model';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message, Tag } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createSecretApi, getSecretOptionsApi } from '#/api/platform/secret';

import SecretValuesEditor from './secret-values-editor.vue';

interface ValuesEditorApi {
  getValues: () => Record<string, string>;
  reset: () => void;
  validate: () => { message?: string; valid: boolean };
}

const emit = defineEmits<{ success: [] }>();

const selectedTypeDefinition = ref<SecretTypeOption>();
const typeOptions = ref<SecretTypeOption[]>([]);
const ownerModules = ref<SecretOwnerModuleOption[]>([]);
const valuesEditorRef = ref<null | ValuesEditorApi>(null);

function purposeOptions(ownerModule?: string) {
  return (
    ownerModules.value.find((item) => item.value === ownerModule)?.purposes ??
    []
  );
}

async function applyOwnerModule(ownerModule?: string) {
  await formApi.setValues({ purposeScope: [] });
  formApi.updateSchema([
    {
      componentProps: {
        disabled: !ownerModule,
        mode: 'multiple',
        options: purposeOptions(ownerModule),
        placeholder: ownerModule ? '请选择允许用途' : '请先选择所属模块',
      },
      fieldName: 'purposeScope',
    },
  ]);
}

function schema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { maxlength: 100, placeholder: '例如：生产库只读账号' },
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
      component: 'Select',
      componentProps: {
        onChange: (value: SecretType) => {
          selectedTypeDefinition.value = typeOptions.value.find(
            (item) => item.value === value,
          );
        },
        options: [],
        placeholder: '请选择凭据结构',
      },
      fieldName: 'secretType',
      label: '凭据类型',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        onChange: (value: string) => applyOwnerModule(value),
        options: [],
        placeholder: '请选择凭据消费模块',
      },
      fieldName: 'ownerModule',
      help: '只允许已接入 SecretProvider 的模块使用该凭据',
      label: '所属模块',
      rules: 'selectRequired',
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
        disabled: true,
        mode: 'multiple',
        options: [],
        placeholder: '请先选择所属模块',
      },
      fieldName: 'purposeScope',
      formItemClass: 'col-span-full',
      help: '运行时按用途精确校验；未选中的用途无法读取该凭据',
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
  await formApi.resetForm();
  selectedTypeDefinition.value = undefined;
  valuesEditorRef.value?.reset();
}

async function handleConfirm() {
  try {
    modalApi.lock(true);
    const { valid } = await formApi.validate();
    if (!valid) return;

    const secretValidation = valuesEditorRef.value?.validate();
    if (!secretValidation?.valid) {
      message.warning(secretValidation?.message ?? '请填写凭据值');
      return;
    }

    const values = await formApi.getValues();
    await createSecretApi({
      description: values.description?.trim() || null,
      expireTime: values.expireTime || null,
      ownerModule: values.ownerModule,
      purposeScope: values.purposeScope.join(','),
      secretName: values.secretName.trim(),
      secretType: values.secretType,
      values: valuesEditorRef.value?.getValues() ?? {},
    });
    message.success('凭据已安全保存');
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
    try {
      modalApi.modalLoading(true);
      await reset();
      const options = await getSecretOptionsApi();
      typeOptions.value = options.secretTypes;
      ownerModules.value = options.ownerModules;
      formApi.updateSchema([
        {
          componentProps: {
            onChange: (value: SecretType) => {
              selectedTypeDefinition.value = typeOptions.value.find(
                (item) => item.value === value,
              );
            },
            options: options.secretTypes,
            placeholder: '请选择凭据结构',
          },
          fieldName: 'secretType',
        },
        {
          componentProps: {
            onChange: (value: string) => applyOwnerModule(value),
            options: ownerModules.value,
            placeholder: '请选择凭据消费模块',
          },
          fieldName: 'ownerModule',
        },
      ]);
    } finally {
      modalApi.modalLoading(false);
    }
  },
});
</script>

<template>
  <Modal :close-on-click-modal="false" class="w-[780px]" title="新建凭据">
    <div class="space-y-6 py-1">
      <Form />

      <section>
        <div class="mb-2 flex items-center gap-2">
          <span class="text-sm font-semibold">敏感值</span>
          <Tag color="gold">仅写入一次</Tag>
        </div>
        <SecretValuesEditor
          ref="valuesEditorRef"
          :definition="selectedTypeDefinition"
        />
      </section>
    </div>
  </Modal>
</template>
