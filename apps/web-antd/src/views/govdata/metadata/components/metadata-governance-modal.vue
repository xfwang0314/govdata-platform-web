<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import type { ID } from '#/api/common';
import type {
  MetadataAssetView,
  MetadataGovernanceCommand,
  MetadataOptionsView,
} from '#/api/govdata/metadata/model';

import { computed, reactive, ref } from 'vue';

import { Form, FormItem, Input, message, Modal, Select } from 'antdv-next';

import {
  getMetadataOptionsApi,
  updateMetadataGovernanceApi,
} from '#/api/govdata/metadata';
import { listUserByDeptId } from '#/api/system/user';

const emit = defineEmits<{ saved: [asset: MetadataAssetView] }>();

const openState = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();
const assetId = ref<ID>();
const options = ref<MetadataOptionsView>();
const stewardOptions = ref<{ label: string; value: ID }[]>([]);
const securityLevelOptions = computed(() =>
  options.value?.securityLevels.map((item) => ({
    ...item,
    value: Number(item.value),
  })),
);
const form = reactive<MetadataGovernanceCommand>({
  businessName: null,
  classificationCode: 'INTERNAL',
  description: null,
  displayName: null,
  governanceStatus: 'UNMANAGED',
  lockVersion: 0,
  securityLevel: 1,
  stewardUserId: null,
});

async function open(asset: MetadataAssetView) {
  assetId.value = asset.assetId;
  Object.assign(form, {
    businessName: asset.businessName,
    classificationCode: asset.classificationCode,
    description: asset.description,
    displayName: asset.displayName,
    governanceStatus: asset.governanceStatus,
    lockVersion: asset.lockVersion,
    securityLevel: asset.securityLevel,
    stewardUserId: asset.stewardUserId,
  });
  openState.value = true;
  loading.value = true;
  try {
    const [metadataOptions, users] = await Promise.all([
      getMetadataOptionsApi(),
      listUserByDeptId(asset.ownerDeptId),
    ]);
    options.value = metadataOptions;
    stewardOptions.value = users.map((user) => ({
      label: `${user.userName} · ${user.nickName}`,
      value: user.userId,
    }));
  } finally {
    loading.value = false;
  }
}

async function submit() {
  await formRef.value?.validate();
  if (!assetId.value) return;
  loading.value = true;
  try {
    const saved = await updateMetadataGovernanceApi(assetId.value, {
      ...form,
      securityLevel: Number(form.securityLevel),
    });
    emit('saved', saved);
    openState.value = false;
    message.success('治理属性已保存');
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal
    v-model:open="openState"
    title="维护元数据治理属性"
    :confirm-loading="loading"
    :width="720"
    ok-text="保存治理属性"
    @ok="submit"
  >
    <p class="mb-4 text-xs leading-relaxed text-muted-foreground">
      业务名称、责任人和分类分级可人工维护；物理名称、字段类型等技术事实由采集自动更新。
    </p>
    <Form
      ref="formRef"
      :model="form"
      class="gov-console-form"
      layout="vertical"
    >
      <div class="grid grid-cols-1 gap-x-5 md:grid-cols-2">
        <FormItem label="展示名称" name="displayName">
          <Input
            v-model:value="form.displayName"
            :maxlength="200"
            allow-clear
          />
        </FormItem>
        <FormItem label="业务名称" name="businessName">
          <Input
            v-model:value="form.businessName"
            :maxlength="200"
            allow-clear
          />
        </FormItem>
        <FormItem label="数据管理员" name="stewardUserId">
          <Select
            v-model:value="form.stewardUserId"
            :options="stewardOptions"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="请选择权属部门内的数据管理员"
          />
        </FormItem>
        <FormItem
          label="治理状态"
          name="governanceStatus"
          :rules="[{ required: true, message: '请选择治理状态' }]"
        >
          <Select
            v-model:value="form.governanceStatus"
            :options="options?.governanceStatuses"
          />
        </FormItem>
        <FormItem
          label="数据分类"
          name="classificationCode"
          :rules="[{ required: true, message: '请选择数据分类' }]"
        >
          <Select
            v-model:value="form.classificationCode"
            :options="options?.classifications"
          />
        </FormItem>
        <FormItem
          label="安全等级"
          name="securityLevel"
          :rules="[{ required: true, message: '请选择安全等级' }]"
        >
          <Select
            v-model:value="form.securityLevel"
            :options="securityLevelOptions"
          />
        </FormItem>
        <FormItem label="业务说明" name="description" class="md:col-span-2">
          <Input.TextArea
            v-model:value="form.description"
            :maxlength="500"
            :rows="4"
            show-count
          />
        </FormItem>
      </div>
    </Form>
  </Modal>
</template>
