<script setup lang="ts">
import type { ID } from '#/api/common';
import type {
  DatabaseView,
  DataSourceView,
} from '#/api/govdata/datasource/model';
import type {
  HarvestOptionsView,
  HarvestPlanCommand,
  HarvestPlanView,
  HarvestRuleCommand,
} from '#/api/govdata/metadata-harvest/model';
import type { DeptTree } from '#/api/system/user/model';

import { computed, onMounted, ref } from 'vue';

import { addFullName } from '@vben/utils';

import { ArrowLeftOutlined } from '@antdv-next/icons';
import {
  Button,
  Checkbox,
  Divider,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
  TreeSelect,
} from 'antdv-next';

import {
  getDataSourceDatabasesApi,
  getDataSourcePageApi,
  getDataSourceTablesApi,
} from '#/api/govdata/datasource';
import {
  createHarvestPlanApi,
  executeHarvestPlanApi,
  getHarvestOptionsApi,
  getHarvestPlanApi,
  updateHarvestPlanApi,
} from '#/api/govdata/metadata-harvest';
import { getDeptTree } from '#/api/system/user';
import { CronInput } from '#/components/cron';
import { consoleFormLayout } from '#/components/govdata/console-form';

import { buildDatabaseOptions, buildSchemaOptions } from '../harvest-namespace';

type WorkspaceMode = 'create' | 'edit' | 'view';

const props = withDefaults(
  defineProps<{
    embedded?: boolean;
    initialDatasourceId?: ID;
    mode: WorkspaceMode;
    plan?: HarvestPlanView;
  }>(),
  {
    embedded: false,
    initialDatasourceId: undefined,
    plan: undefined,
  },
);
const emit = defineEmits<{
  back: [];
  saved: [plan: HarvestPlanView];
}>();

const loading = ref(false);
const submitting = ref(false);
const executing = ref(false);
const editing = ref(props.mode !== 'view');
const detail = ref<HarvestPlanView>();
const options = ref<HarvestOptionsView>();
const datasources = ref<DataSourceView[]>([]);
const departments = ref<DeptTree[]>([]);
const databases = ref<DatabaseView[]>([]);
const schemas = ref<string[]>([]);
const namespaceLoading = ref(false);

function emptyRule(scope: string, sortNo = 0): HarvestRuleCommand {
  return {
    matchType: 'EXACT',
    rulePattern: '',
    ruleScope: scope,
    ruleType: 'INCLUDE',
    sortNo,
  };
}

function emptyModel(): HarvestPlanCommand {
  return {
    cronExpression: '0 0 2 * * ?',
    datasourceId: props.initialDatasourceId ?? '',
    harvestPlanName: '',
    maxTableCount: 1000,
    ownerDeptId: '',
    planStatus: 'DISABLED',
    rawArchiveFlag: false,
    rules: [],
    scheduleType: 'MANUAL',
  };
}

const model = ref<HarvestPlanCommand>(emptyModel());
const isCreate = computed(() => props.mode === 'create' && !detail.value);
const readonly = computed(() => !editing.value);
const selectedDatasource = computed(() =>
  datasources.value.find(
    (item) => String(item.datasourceId) === String(model.value.datasourceId),
  ),
);
const datasourceOptions = computed(() =>
  datasources.value
    .filter(
      (item) =>
        item.status === 'ACTIVE' ||
        String(item.datasourceId) === String(model.value.datasourceId),
    )
    .map((item) => ({
      label: `${item.datasourceName} · ${item.connectorCode}`,
      value: item.datasourceId,
    })),
);
const datasourceName = computed(
  () => selectedDatasource.value?.datasourceName ?? '未选择数据源',
);
const databaseOptions = computed(() =>
  buildDatabaseOptions(databases.value, model.value.catalogName),
);
const schemaOptions = computed(() =>
  buildSchemaOptions(databases.value, schemas.value, model.value.schemaName),
);
const supportsDatabase = computed(() => databaseOptions.value.length > 0);
const supportsSchema = computed(() => schemaOptions.value.length > 0);
const ruleGroups = computed(() => [
  ...(supportsDatabase.value
    ? [
        {
          description: '限定需要纳入或排除的数据库名称。',
          scope: 'CATALOG',
          title: '数据库规则',
        },
      ]
    : []),
  ...(supportsSchema.value
    ? [
        {
          description: '限定需要纳入或排除的 Schema 名称。',
          scope: 'SCHEMA',
          title: 'Schema 规则',
        },
      ]
    : []),
  {
    description: '限定需要采集或忽略的数据表名称。',
    scope: 'TABLE',
    title: '数据表规则',
  },
]);
const workspaceTitle = computed(() => {
  if (isCreate.value) return '新建采集计划';
  return (
    detail.value?.harvestPlanName ?? props.plan?.harvestPlanName ?? '采集计划'
  );
});

function applyDetail(value: HarvestPlanView) {
  detail.value = value;
  model.value = {
    catalogName: value.catalogName ?? undefined,
    cronExpression: value.cronExpression ?? undefined,
    datasourceId: value.datasourceId,
    harvestPlanName: value.harvestPlanName,
    lockVersion: value.lockVersion,
    maxTableCount: value.maxTableCount,
    ownerDeptId: value.ownerDeptId,
    planStatus: value.planStatus,
    rawArchiveFlag: value.rawArchiveFlag,
    rules: value.rules.map(({ harvestRuleId: _id, ...rule }) => rule),
    scheduleType: value.scheduleType,
    schemaName: value.schemaName ?? undefined,
  };
}

function rulesForScope(scope: string) {
  return model.value.rules.filter((rule) => rule.ruleScope === scope);
}

function addRule(scope: string) {
  model.value.rules.push(emptyRule(scope, model.value.rules.length));
}

function removeRule(rule: HarvestRuleCommand) {
  const index = model.value.rules.indexOf(rule);
  if (index === -1) return;
  model.value.rules.splice(index, 1);
  model.value.rules.forEach((rule, sortNo) => (rule.sortNo = sortNo));
}

function regexError(rule: HarvestRuleCommand): string | undefined {
  if (rule.matchType !== 'REGEX' || !rule.rulePattern.trim()) return;
  if (/\(\?(?:[=!]|<[=!])|\\[1-9]|\\k</.test(rule.rulePattern)) {
    return '不支持前后查找和反向引用';
  }
  try {
    new RegExp(rule.rulePattern).test('');
  } catch {
    return '正则表达式语法无效';
  }
}

async function loadSchemas(datasourceId: ID, catalog?: string) {
  schemas.value = [];
  if (!catalog) return;
  const tables = await getDataSourceTablesApi(datasourceId, {
    catalog,
    limit: 1000,
    offset: 0,
  });
  schemas.value = [
    ...new Set(tables.flatMap((table) => (table.schema ? [table.schema] : []))),
  ].toSorted((left, right) => left.localeCompare(right));
}

async function loadNamespaces(datasourceId?: ID, catalog?: string) {
  databases.value = [];
  schemas.value = [];
  if (!datasourceId) return;
  namespaceLoading.value = true;
  try {
    databases.value = await getDataSourceDatabasesApi(datasourceId);
    const discoveredSchemaOptions = buildSchemaOptions(databases.value, []);
    if (
      databaseOptions.value.length === 0 &&
      discoveredSchemaOptions.length > 0
    ) {
      if (
        !model.value.schemaName &&
        model.value.catalogName &&
        discoveredSchemaOptions.some(
          (item) => item.value === model.value.catalogName,
        )
      ) {
        model.value.schemaName = model.value.catalogName;
      }
      model.value.catalogName = undefined;
    }
    const probeCatalog = supportsDatabase.value
      ? (catalog ?? databaseOptions.value[0]?.value)
      : undefined;
    if (probeCatalog) await loadSchemas(datasourceId, probeCatalog);
  } catch {
    message.warning('未能读取数据源命名空间，请确认数据源已启用且连接正常');
  } finally {
    namespaceLoading.value = false;
  }
}

async function handleDatasourceChange(datasourceId: ID) {
  model.value.catalogName = undefined;
  model.value.schemaName = undefined;
  model.value.rules = [];
  await loadNamespaces(datasourceId);
}

async function handleDatabaseChange(catalog?: string) {
  model.value.schemaName = undefined;
  if (!model.value.datasourceId) return;
  namespaceLoading.value = true;
  try {
    await loadSchemas(model.value.datasourceId, catalog);
  } catch {
    message.warning('未能读取该数据库的 Schema 清单');
  } finally {
    namespaceLoading.value = false;
  }
}

function cancelEdit() {
  if (props.embedded || isCreate.value) {
    emit('back');
    return;
  }
  if (detail.value) applyDetail(detail.value);
  editing.value = false;
}

async function submit() {
  const creating = !detail.value;
  if (
    !model.value.harvestPlanName.trim() ||
    !model.value.datasourceId ||
    !model.value.ownerDeptId
  ) {
    message.warning('请填写计划名称、目标数据源和权属部门');
    return;
  }
  if (
    model.value.scheduleType === 'CRON' &&
    !model.value.cronExpression?.trim()
  ) {
    message.warning('定时采集必须配置 Cron 表达式');
    return;
  }
  if (model.value.rules.some((rule) => !rule.rulePattern.trim())) {
    message.warning('过滤规则的匹配值不能为空');
    return;
  }
  if (model.value.rules.some((rule) => regexError(rule))) {
    message.warning('请修正采集范围中的正则表达式');
    return;
  }
  submitting.value = true;
  try {
    const payload: HarvestPlanCommand = {
      ...model.value,
      catalogName: model.value.catalogName?.trim() || undefined,
      cronExpression:
        model.value.scheduleType === 'CRON'
          ? model.value.cronExpression?.trim()
          : undefined,
      harvestPlanName: model.value.harvestPlanName.trim(),
      rules: model.value.rules
        .filter(
          (rule) =>
            (supportsDatabase.value || rule.ruleScope !== 'CATALOG') &&
            (supportsSchema.value || rule.ruleScope !== 'SCHEMA'),
        )
        .map((rule, sortNo) => ({
          ...rule,
          rulePattern: rule.rulePattern.trim(),
          sortNo,
        })),
      schemaName: model.value.schemaName?.trim() || undefined,
    };
    const saved = detail.value
      ? await updateHarvestPlanApi(detail.value.harvestPlanId, payload)
      : await createHarvestPlanApi(payload);
    const refreshed = await getHarvestPlanApi(saved.harvestPlanId);
    applyDetail(refreshed);
    editing.value = false;
    message.success(creating ? '采集计划已创建' : '采集计划已保存');
    emit('saved', refreshed);
  } finally {
    submitting.value = false;
  }
}

async function execute() {
  if (!detail.value) return;
  executing.value = true;
  try {
    const run = await executeHarvestPlanApi(detail.value.harvestPlanId);
    message.success(
      `采集结束：发现 ${run.discoveredTableCount} 张表，修订 ${run.changedTableCount} 张，失败 ${run.failedTableCount} 张`,
    );
  } finally {
    executing.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const [optionResult, datasourceResult, deptResult, planDetail] =
      await Promise.all([
        getHarvestOptionsApi(),
        getDataSourcePageApi({ pageNum: 1, pageSize: 1000 }),
        getDeptTree(),
        props.plan
          ? getHarvestPlanApi(props.plan.harvestPlanId)
          : Promise.resolve(undefined),
      ]);
    options.value = optionResult;
    datasources.value = datasourceResult.rows;
    addFullName(deptResult, 'label', ' / ');
    departments.value = deptResult;
    if (planDetail) applyDetail(planDetail);
    await loadNamespaces(model.value.datasourceId, model.value.catalogName);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section
    v-loading="loading"
    class="gov-harvest-plan-workspace"
    :class="{ 'gov-harvest-plan-workspace--modal': embedded }"
  >
    <header class="gov-harvest-workspace-header">
      <div class="flex min-w-0 items-center gap-3">
        <template v-if="!embedded">
          <Button type="text" @click="emit('back')">
            <template #icon><ArrowLeftOutlined /></template>
            返回采集列表
          </Button>
          <span class="gov-console-divider" aria-hidden="true"></span>
        </template>
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <h2 class="truncate text-lg font-semibold">{{ workspaceTitle }}</h2>
            <span
              v-if="detail"
              class="gov-console-status"
              :data-tone="
                detail.planStatus === 'ACTIVE' ? 'success' : 'warning'
              "
            >
              <i class="gov-console-status__dot"></i>
              {{ detail.planStatus === 'ACTIVE' ? '运行中' : '已停用' }}
            </span>
          </div>
          <p class="mt-0.5 truncate text-xs text-muted-foreground">
            {{ datasourceName }}
            <template v-if="detail">
              · {{ detail.harvestPlanCode }} · 第
              {{ detail.currentPlanRevisionNo }} 版
            </template>
          </p>
        </div>
      </div>
    </header>

    <div class="gov-harvest-configuration gov-console-form">
      <Form v-bind="consoleFormLayout.nativeProps" :disabled="readonly">
        <section class="gov-harvest-form-section">
          <Divider
            class="gov-form-section-divider"
            plain
            title-placement="start"
          >
            基础配置
          </Divider>
          <div :class="consoleFormLayout.gridClass">
            <FormItem label="计划名称" required>
              <Input
                v-model:value="model.harvestPlanName"
                :maxlength="200"
                placeholder="请输入采集计划名称"
              />
            </FormItem>
            <FormItem label="目标数据源" required>
              <Select
                v-model:value="model.datasourceId"
                :disabled="readonly || Boolean(initialDatasourceId)"
                :options="datasourceOptions"
                option-filter-prop="label"
                placeholder="请选择目标数据源"
                show-search
                @change="handleDatasourceChange"
              />
            </FormItem>
            <FormItem label="权属部门" required>
              <TreeSelect
                v-model:value="model.ownerDeptId"
                :field-names="{
                  children: 'children',
                  label: 'label',
                  value: 'id',
                }"
                :tree-data="departments"
                placeholder="请选择权属部门"
                tree-default-expand-all
                tree-node-filter-prop="fullName"
                tree-node-label-prop="fullName"
              />
            </FormItem>
            <FormItem label="采集状态" required>
              <Select
                v-model:value="model.planStatus"
                :options="options?.planStatuses"
                placeholder="请选择采集状态"
              />
            </FormItem>
          </div>
        </section>

        <div :class="consoleFormLayout.gridClass">
          <section class="gov-harvest-form-section">
            <Divider
              class="gov-form-section-divider"
              plain
              title-placement="start"
            >
              采集范围
            </Divider>
            <p class="gov-harvest-section-help">
              命名空间由目标数据源实时读取；留空表示当前层级全部对象。
            </p>
            <div class="grid grid-cols-1">
              <FormItem v-if="supportsDatabase" label="限定数据库">
                <Select
                  v-model:value="model.catalogName"
                  allow-clear
                  :loading="namespaceLoading"
                  :options="databaseOptions"
                  option-filter-prop="label"
                  placeholder="全部数据库"
                  show-search
                  @change="handleDatabaseChange"
                />
              </FormItem>
              <FormItem v-if="supportsSchema" label="限定 Schema">
                <Select
                  v-model:value="model.schemaName"
                  allow-clear
                  :disabled="supportsDatabase && !model.catalogName"
                  :loading="namespaceLoading"
                  :options="schemaOptions"
                  option-filter-prop="label"
                  placeholder="全部 Schema"
                  show-search
                />
              </FormItem>
              <FormItem label="单次最大表数" required>
                <InputNumber
                  v-model:value="model.maxTableCount"
                  :max="1000"
                  :min="1"
                  class="w-full"
                />
              </FormItem>
              <FormItem label="原始采集批次">
                <Checkbox v-model:checked="model.rawArchiveFlag">
                  保留对象存储归档
                </Checkbox>
              </FormItem>
            </div>
          </section>

          <section class="gov-harvest-form-section">
            <Divider
              class="gov-form-section-divider"
              plain
              title-placement="start"
            >
              调度配置
            </Divider>
            <p class="gov-harvest-section-help">
              支持手工运行或使用 Cron 表达式按周期自动采集。
            </p>
            <div class="grid grid-cols-1">
              <FormItem label="调度方式" required>
                <Select
                  v-model:value="model.scheduleType"
                  :options="options?.scheduleTypes"
                  placeholder="请选择调度方式"
                />
              </FormItem>
              <FormItem
                v-if="model.scheduleType === 'CRON'"
                label="Cron 表达式"
                required
              >
                <CronInput
                  v-model:value="model.cronExpression"
                  :disabled="readonly"
                />
              </FormItem>
            </div>
          </section>
        </div>

        <section class="gov-harvest-form-section">
          <Divider
            class="gov-form-section-divider"
            plain
            title-placement="start"
          >
            范围过滤规则
          </Divider>
          <p class="gov-harvest-section-help">
            数据库、Schema、数据表分别配置；支持精确匹配和正则表达式等方式。正则按完整名称匹配，不支持前后查找和反向引用。
          </p>
          <div class="space-y-3">
            <section
              v-for="group in ruleGroups"
              :key="group.scope"
              class="gov-harvest-rule-group"
            >
              <header class="gov-harvest-rule-group__header">
                <div>
                  <h3>{{ group.title }}</h3>
                  <p>{{ group.description }}</p>
                </div>
                <Button
                  v-if="!readonly"
                  size="small"
                  @click="addRule(group.scope)"
                >
                  添加规则
                </Button>
              </header>
              <div
                v-if="rulesForScope(group.scope).length > 0"
                class="space-y-2"
              >
                <div
                  v-for="rule in rulesForScope(group.scope)"
                  :key="rule.sortNo"
                  class="gov-harvest-rule-row"
                >
                  <Select
                    v-model:value="rule.ruleType"
                    :disabled="readonly"
                    :options="options?.ruleTypes"
                    placeholder="纳入或排除"
                  />
                  <Select
                    v-model:value="rule.matchType"
                    :disabled="readonly"
                    :options="options?.matchTypes"
                    placeholder="匹配方式"
                  />
                  <div class="min-w-0">
                    <Input
                      v-model:value="rule.rulePattern"
                      :disabled="readonly"
                      :maxlength="500"
                      :placeholder="
                        rule.matchType === 'REGEX'
                          ? '例如 ^gov_.*$'
                          : '请输入匹配值'
                      "
                      :status="regexError(rule) ? 'error' : undefined"
                    />
                    <p v-if="regexError(rule)" class="text-xs text-destructive">
                      {{ regexError(rule) }}
                    </p>
                  </div>
                  <Button
                    v-if="!readonly"
                    danger
                    type="text"
                    @click="removeRule(rule)"
                  >
                    删除
                  </Button>
                </div>
              </div>
              <div v-else class="gov-harvest-empty-rule">
                未配置{{ group.title }}，默认不限制该层级。
              </div>
            </section>
          </div>
        </section>
      </Form>
    </div>
    <footer class="gov-console-form-actions">
      <div class="flex items-center gap-2">
        <template v-if="editing">
          <Button @click="cancelEdit">取消</Button>
          <Button
            v-access:code="[
              isCreate
                ? 'govdata:metadata:harvest:add'
                : 'govdata:metadata:harvest:edit',
            ]"
            :loading="submitting"
            type="primary"
            @click="submit"
          >
            保存计划
          </Button>
        </template>
        <template v-else>
          <Button
            v-access:code="['govdata:metadata:harvest:edit']"
            @click="editing = true"
          >
            编辑计划
          </Button>
          <Button
            v-access:code="['govdata:metadata:harvest:execute']"
            :loading="executing"
            type="primary"
            @click="execute"
          >
            立即采集
          </Button>
        </template>
      </div>
    </footer>
  </section>
</template>
