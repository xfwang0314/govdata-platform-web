<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type { ID } from '#/api/common';
import type {
  ConnectorDescriptor,
  ConnectorFieldDescriptor,
  DataSourceCommand,
  DataSourceEndpointConfig,
  DataSourceOptionsView,
  DataSourceView,
  SecretReference,
} from '#/api/govdata/datasource/model';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { addFullName, getPopupContainer } from '@vben/utils';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createDataSourceApi,
  getConnectorsApi,
  getDataSourceApi,
  getDataSourceOptionsApi,
  getSecretReferencesApi,
  updateDataSourceApi,
} from '#/api/govdata/datasource';
import { getDeptTree } from '#/api/system/user';
import {
  consoleFormConfig,
  consoleFormSection as divider,
} from '#/components/govdata/console-form';

import {
  normalizeSecurityLevelOptions,
  unwrapFormChangeValue,
} from '../datasource-form.utils';

const emit = defineEmits<{ success: [] }>();

const connectors = ref<ConnectorDescriptor[]>([]);
const datasourceOptions = ref<DataSourceOptionsView>();
const departmentTree = ref<any[]>([]);
const secretReferences = ref<SecretReference[]>([]);
const selectedConnectorCode = ref<string>();
const selectedAuthProfileCode = ref<string>();
const isUpdate = ref(false);
const recordId = ref<ID>();
const editLockVersion = ref<number>();

const title = computed(() => (isUpdate.value ? '编辑数据源' : '新建数据源'));

function findConnector(code?: string) {
  return connectors.value.find((item) => item.connectorCode === code);
}

function endpointFieldName(code: string) {
  return `endpoint_${code}`;
}

function endpointSchema(field: ConnectorFieldDescriptor): VbenFormSchema {
  const common = {
    componentProps: {
      onChange: (value: unknown) =>
        refreshConnectionPreview(field.code, unwrapFormChangeValue(value)),
      placeholder: field.description ?? `请输入${field.label}`,
    },
    defaultValue: field.defaultValue ?? undefined,
    fieldName: endpointFieldName(field.code),
    help: field.description ?? undefined,
    label: field.label,
    rules: field.required ? 'required' : undefined,
  } satisfies Partial<VbenFormSchema>;

  if (field.valueType === 'INTEGER') {
    return {
      ...common,
      component: 'InputNumber',
      componentProps: {
        ...common.componentProps,
        max: field.maxValue ?? undefined,
        min: field.minValue ?? undefined,
        precision: 0,
      },
    } as VbenFormSchema;
  }
  if (field.valueType === 'ENUM') {
    return {
      ...common,
      component: 'Select',
      componentProps: {
        ...common.componentProps,
        getPopupContainer,
        options: field.options.map((value) => ({ label: value, value })),
      },
    } as VbenFormSchema;
  }
  if (field.valueType === 'BOOLEAN') {
    return {
      ...common,
      component: 'Switch',
      rules: undefined,
    } as VbenFormSchema;
  }
  return { ...common, component: 'Input' } as VbenFormSchema;
}

function applicableEndpointFields(descriptor?: ConnectorDescriptor) {
  const authProfileCode = selectedAuthProfileCode.value;
  return (descriptor?.endpointFields ?? []).filter(
    (field) =>
      field.authProfileCodes.length === 0 ||
      (authProfileCode !== undefined &&
        field.authProfileCodes.includes(authProfileCode)),
  );
}

function connectionPreviewSchema(
  descriptor?: ConnectorDescriptor,
): VbenFormSchema[] {
  const preview = descriptor?.connectionPreview;
  if (!preview) return [];
  return [
    {
      component: 'Input',
      componentProps: {
        class: 'font-mono',
        placeholder: '选择数据源类型后由系统自动生成',
        readonly: true,
      },
      fieldName: 'connectionTargetPreview',
      formItemClass: 'col-span-full',
      help: '连接目标由系统根据基础连接信息生成，用户不能直接修改',
      label: preview.label,
    },
  ];
}

function customPropertiesSchema(
  descriptor?: ConnectorDescriptor,
): VbenFormSchema[] {
  if (!descriptor?.customPropertiesSupported) return [];
  return [
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { maxRows: 6, minRows: 3 },
        placeholder:
          '每行一个非敏感连接属性，例如：\nconnectTimeout=5000\nsocketTimeout=10000',
      },
      fieldName: 'connectionPropertiesText',
      formItemClass: 'col-span-full',
      help: '可选。每行使用 key=value；密码、Token、私钥等必须放入凭据保险库',
      label: '连接属性',
    },
  ];
}

function schema(): VbenFormSchema[] {
  const options = datasourceOptions.value;
  const descriptor = findConnector(selectedConnectorCode.value);
  const authProfiles = descriptor?.authProfiles ?? [];
  const selectedProfile = authProfiles.find(
    (item) => item.profileCode === selectedAuthProfileCode.value,
  );
  const secretRequired = Boolean(selectedProfile?.secretType);
  let secretPlaceholder = '当前认证方式不需要凭据';
  if (secretRequired) {
    secretPlaceholder = selectedConnectorCode.value
      ? '请选择匹配的有效凭据'
      : '请先选择数据源类型';
  }
  return [
    divider('basicDivider', '基础信息'),
    {
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '例如：省级人口库（生产）',
      },
      fieldName: 'datasourceName',
      label: '数据源名称',
      rules: 'required',
    },
    {
      component: 'TreeSelect',
      componentProps: {
        fieldNames: { children: 'children', label: 'label', value: 'id' },
        getPopupContainer,
        placeholder: '请选择权属部门',
        treeData: departmentTree.value,
        treeDefaultExpandAll: true,
        treeNodeFilterProp: 'fullName',
        treeNodeLabelProp: 'fullName',
      },
      fieldName: 'ownerDeptId',
      label: '权属部门',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        getPopupContainer,
        options: options?.environments ?? [],
      },
      fieldName: 'environment',
      label: '所属环境',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        getPopupContainer,
        options: options?.accessModes ?? [],
      },
      fieldName: 'accessMode',
      label: '访问模式',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        getPopupContainer,
        options: options?.classifications ?? [],
      },
      fieldName: 'classificationCode',
      label: '安全分类',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        getPopupContainer,
        options: options?.securityLevels ?? [],
      },
      fieldName: 'securityLevel',
      label: '安全等级',
      rules: 'selectRequired',
    },
    divider('connectionDivider', '连接与认证'),
    {
      component: 'Select',
      componentProps: {
        getPopupContainer,
        onChange: (value: string) => handleConnectorChange(value),
        options: connectors.value.map((item) => ({
          label: item.connectorName,
          value: item.connectorCode,
        })),
        placeholder: '请选择数据源类型',
      },
      fieldName: 'connectorCode',
      label: '数据源类型',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        disabled: authProfiles.length <= 1,
        onChange: (value: string) => handleAuthProfileChange(value),
        options: authProfiles.map((item) => ({
          label: item.profileName,
          value: item.profileCode,
        })),
      },
      fieldName: 'authProfileCode',
      help: '认证方式由 Connector 声明；切换后需要重新选择匹配的凭据',
      label: '认证方式',
      rules: 'selectRequired',
    },
    ...applicableEndpointFields(descriptor).map((field) =>
      endpointSchema(field),
    ),
    {
      component: 'Select',
      componentProps: {
        getPopupContainer,
        optionFilterProp: 'label',
        disabled: !secretRequired,
        options: secretReferences.value.map((item) => ({
          disabled: item.secretType !== selectedProfile?.secretType,
          label:
            item.secretType === selectedProfile?.secretType
              ? `${item.secretName}（${item.secretType}）`
              : `${item.secretName}（${item.secretType}，不匹配当前认证方式）`,
          value: item.secretRef,
        })),
        placeholder: secretPlaceholder,
        showSearch: true,
      },
      fieldName: 'secretRef',
      help: secretRequired
        ? '这里只保存凭据引用；后端会再次校验类型、用途和必需字段'
        : '无认证模式不会保存凭据引用',
      label: '连接凭据',
      rules: secretRequired ? 'selectRequired' : undefined,
    },
    ...connectionPreviewSchema(descriptor),
    ...customPropertiesSchema(descriptor),
  ];
}

const [Form, formApi] = useVbenForm({
  ...consoleFormConfig(),
  schema: [],
});

async function refreshSchema() {
  formApi.setState({ schema: schema() });
}

async function handleConnectorChange(
  connectorCode: string,
  preserveSecret = false,
  endpointConfig: Record<string, unknown> = {},
  preferredAuthProfileCode?: string,
) {
  selectedConnectorCode.value = connectorCode;
  const descriptor = findConnector(connectorCode);
  const profile =
    descriptor?.authProfiles.find(
      (item) => item.profileCode === preferredAuthProfileCode,
    ) ?? descriptor?.authProfiles[0];
  selectedAuthProfileCode.value = profile?.profileCode;
  secretReferences.value = descriptor
    ? await getSecretReferencesApi(connectorCode)
    : [];
  const previous = await formApi.getValues();
  await refreshSchema();
  const endpointValues: Record<string, unknown> = {};
  for (const field of applicableEndpointFields(descriptor)) {
    endpointValues[endpointFieldName(field.code)] =
      endpointConfig[field.code] ?? field.defaultValue ?? undefined;
  }
  await formApi.setValues({
    ...previous,
    ...endpointValues,
    authProfileCode: profile?.profileCode,
    connectorCode,
    secretRef: preserveSecret ? previous.secretRef : undefined,
  });
  await refreshConnectionPreview();
}

async function handleAuthProfileChange(authProfileCode: string) {
  selectedAuthProfileCode.value = authProfileCode;
  await formApi.setValues({ authProfileCode, secretRef: undefined });
  await refreshSchema();
  await refreshConnectionPreview();
}

async function refreshConnectionPreview(
  changedField?: string,
  changedValue?: unknown,
) {
  const descriptor = findConnector(selectedConnectorCode.value);
  const preview = descriptor?.connectionPreview;
  if (!descriptor || !preview) {
    await formApi.setValues({ connectionTargetPreview: undefined });
    return;
  }
  const values = await formApi.getValues();
  let connectionTarget = preview.template;
  for (const field of applicableEndpointFields(descriptor)) {
    const value =
      field.code === changedField
        ? changedValue
        : values[endpointFieldName(field.code)];
    const display =
      value === undefined || value === null || value === ''
        ? `{${field.code}}`
        : String(value);
    connectionTarget = connectionTarget.replace(`{${field.code}}`, display);
  }
  await formApi.setValues({ connectionTargetPreview: connectionTarget });
}

function parseProperties(text: string | undefined) {
  const properties: Record<string, string> = {};
  for (const [index, line] of (text ?? '').split(/\r?\n/u).entries()) {
    if (!line.trim()) continue;
    const separator = line.indexOf('=');
    if (separator < 1)
      throw new Error(`连接属性第 ${index + 1} 行必须使用 key=value`);
    const key = line.slice(0, separator).trim();
    if (key in properties) throw new Error(`连接属性 ${key} 重复`);
    properties[key] = line.slice(separator + 1).trim();
  }
  return properties;
}

function stringifyProperties(properties?: Record<string, string>) {
  return Object.entries(properties ?? {})
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

function buildCommand(values: Record<string, any>): DataSourceCommand {
  const descriptor = findConnector(values.connectorCode);
  if (!descriptor) throw new Error('请选择有效的数据源类型');
  if (isUpdate.value && editLockVersion.value === undefined) {
    throw new Error('数据源版本信息缺失，请关闭窗口后重新编辑');
  }
  const endpointConfig: DataSourceEndpointConfig = {
    properties: parseProperties(values.connectionPropertiesText),
  };
  for (const field of applicableEndpointFields(descriptor)) {
    endpointConfig[field.code] = values[endpointFieldName(field.code)];
  }
  return {
    accessMode: values.accessMode,
    authProfileCode: values.authProfileCode,
    classificationCode: values.classificationCode,
    connectorCode: values.connectorCode,
    datasourceName: values.datasourceName,
    endpointConfig,
    environment: values.environment,
    lockVersion: isUpdate.value ? editLockVersion.value : undefined,
    ownerDeptId: values.ownerDeptId,
    secretRef: values.secretRef || null,
    securityLevel: values.securityLevel,
  };
}

async function loadReferenceData() {
  const [connectorData, optionData, tree] = await Promise.all([
    getConnectorsApi(),
    getDataSourceOptionsApi(),
    getDeptTree(),
  ]);
  connectors.value = connectorData;
  datasourceOptions.value = {
    ...optionData,
    securityLevels: normalizeSecurityLevelOptions(optionData.securityLevels),
  };
  addFullName(tree, 'label', ' / ');
  departmentTree.value = tree;
}

async function handleConfirm() {
  try {
    modalApi.modalLoading(true);
    const { valid } = await formApi.validate();
    if (!valid) return;
    const command = buildCommand(await formApi.getValues());
    if (isUpdate.value && recordId.value !== undefined) {
      await updateDataSourceApi(recordId.value, command);
      message.success('数据源更新成功，重新测试后可启用');
    } else {
      await createDataSourceApi(command);
      message.success('数据源创建成功，请执行连接测试');
    }
    emit('success');
    await modalApi.close();
  } catch (error) {
    if (error instanceof Error) message.error(error.message);
  } finally {
    modalApi.modalLoading(false);
  }
}

async function initializeForm(id?: ID) {
  await formApi.resetForm();
  editLockVersion.value = undefined;
  await loadReferenceData();
  if (id === undefined) {
    selectedConnectorCode.value = undefined;
    selectedAuthProfileCode.value = undefined;
    secretReferences.value = [];
    await refreshSchema();
    await formApi.setValues({
      accessMode: datasourceOptions.value?.accessModes[0]?.value,
      classificationCode: datasourceOptions.value?.classifications[0]?.value,
      environment: datasourceOptions.value?.environments[0]?.value,
      securityLevel: datasourceOptions.value?.securityLevels[0]?.value,
    });
    return;
  }
  const record: DataSourceView = await getDataSourceApi(id);
  editLockVersion.value = record.lockVersion;
  await handleConnectorChange(
    record.connectorCode,
    true,
    record.endpointConfig,
    record.authProfileCode,
  );
  await formApi.setValues({
    ...record,
    connectionPropertiesText: stringifyProperties(
      record.endpointConfig.properties,
    ),
  });
  await refreshConnectionPreview();
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel: () => modalApi.close(),
  onConfirm: handleConfirm,
  onOpenChange: async (open) => {
    if (!open) return;
    const { id } = modalApi.getData() as { id?: ID };
    isUpdate.value = id !== undefined;
    recordId.value = id;
    try {
      modalApi.modalLoading(true);
      await initializeForm(id);
    } catch {
      message.error('数据源表单初始化失败');
      await modalApi.close();
    } finally {
      modalApi.modalLoading(false);
    }
  },
});
</script>

<template>
  <Modal :close-on-click-modal="false" :title="title" class="w-[920px]">
    <div class="gov-console-form">
      <Form />
    </div>
  </Modal>
</template>
