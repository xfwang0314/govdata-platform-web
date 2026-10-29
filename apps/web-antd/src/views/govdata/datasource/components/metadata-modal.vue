<script setup lang="ts">
import type { ID } from '#/api/common';
import type {
  ColumnView,
  DatabaseView,
  TableSchemaView,
  TableView,
} from '#/api/govdata/datasource/model';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  DatabaseOutlined,
  KeyOutlined,
  RightOutlined,
  SearchOutlined,
  TableOutlined,
} from '@antdv-next/icons';
import { Alert, Empty, Input, Spin, Table } from 'antdv-next';

import {
  getDataSourceDatabasesApi,
  getDataSourceTablesApi,
  inspectDataSourceColumnsApi,
} from '#/api/govdata/datasource';

const datasourceId = ref<ID>();
const datasourceName = ref<string>('');
const loading = ref<boolean>(false);
const errorMessage = ref<string>('');

type Step = 'columns' | 'databases' | 'tables';
const step = ref<Step>('databases');

const databases = ref<DatabaseView[]>([]);
const currentDatabase = ref<DatabaseView | null>(null);

const tables = ref<TableView[]>([]);
const currentTable = ref<null | TableView>(null);
const tableFilterText = ref<string>('');

const columns = ref<ColumnView[]>([]);

const filteredTables = computed(() => {
  if (!tableFilterText.value.trim()) return tables.value;
  const keyword = tableFilterText.value.trim().toLowerCase();
  return tables.value.filter(
    (t) =>
      t.tableName.toLowerCase().includes(keyword) ||
      (t.remarks && t.remarks.toLowerCase().includes(keyword)),
  );
});

const columnTableColumns = [
  {
    dataIndex: 'ordinalPosition',
    key: 'ordinalPosition',
    title: '#',
    width: 60,
  },
  { dataIndex: 'columnName', key: 'columnName', title: '字段名称', width: 180 },
  { dataIndex: 'dataType', key: 'dataType', title: '数据类型', width: 140 },
  { dataIndex: 'columnSize', key: 'columnSize', title: '长度', width: 90 },
  {
    dataIndex: 'decimalDigits',
    key: 'decimalDigits',
    title: '精度',
    width: 80,
  },
  { dataIndex: 'nullable', key: 'nullable', title: '允许为空', width: 100 },
  { dataIndex: 'primaryKey', key: 'primaryKey', title: '主键', width: 120 },
  {
    dataIndex: 'defaultValue',
    key: 'defaultValue',
    title: '默认值',
    width: 120,
  },
  { dataIndex: 'remarks', key: 'remarks', title: '备注说明' },
];

async function loadDatabases() {
  if (datasourceId.value === undefined) return;
  loading.value = true;
  errorMessage.value = '';
  step.value = 'databases';
  currentDatabase.value = null;
  currentTable.value = null;
  databases.value = [];
  tables.value = [];
  columns.value = [];
  try {
    databases.value = await getDataSourceDatabasesApi(datasourceId.value);
  } catch (error: any) {
    databases.value = [];
    errorMessage.value = error?.message || '读取数据库/Schema 列表失败';
  } finally {
    loading.value = false;
  }
}

async function selectDatabase(db: DatabaseView) {
  if (datasourceId.value === undefined) return;
  loading.value = true;
  errorMessage.value = '';
  currentDatabase.value = db;
  currentTable.value = null;
  tableFilterText.value = '';
  tables.value = [];
  columns.value = [];
  step.value = 'tables';
  try {
    tables.value = await getDataSourceTablesApi(datasourceId.value, {
      catalog: db.catalog ?? undefined,
      limit: 1000,
      schema: db.schema ?? undefined,
    });
  } catch (error: any) {
    tables.value = [];
    errorMessage.value = error?.message || '读取表清单失败';
  } finally {
    loading.value = false;
  }
}

async function selectTable(tbl: TableView) {
  if (datasourceId.value === undefined) return;
  loading.value = true;
  errorMessage.value = '';
  currentTable.value = tbl;
  columns.value = [];
  step.value = 'columns';
  try {
    const schemas: TableSchemaView[] = await inspectDataSourceColumnsApi(
      datasourceId.value,
      [tbl.tableName],
      tbl.catalog ?? undefined,
      tbl.schema ?? undefined,
    );
    const firstSchema = schemas && schemas[0];
    columns.value = firstSchema ? firstSchema.columns : [];
  } catch (error: any) {
    columns.value = [];
    errorMessage.value = error?.message || '探测表字段结构失败';
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  footer: false,
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { id, name } = modalApi.getData() as { id?: ID; name?: string };
    datasourceId.value = id;
    datasourceName.value = name || '数据源';
    await loadDatabases();
  },
  title: '元数据探测与查看',
});
</script>

<template>
  <Modal class="w-[1200px]">
    <div class="flex flex-col gap-4 p-4 min-h-[500px]">
      <!-- Breadcrumb Navigation -->
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2 text-sm">
          <span
            class="flex items-center gap-1 cursor-pointer font-medium hover:text-primary transition-colors"
            @click="loadDatabases"
          >
            <DatabaseOutlined /> 数据库/Schema
          </span>
          <span v-if="currentDatabase" class="text-muted-foreground">/</span>
          <span
            v-if="currentDatabase"
            class="cursor-pointer font-medium hover:text-primary transition-colors"
            @click="currentDatabase && selectDatabase(currentDatabase)"
          >
            {{ currentDatabase.databaseName }}
          </span>
          <span v-if="currentTable" class="text-muted-foreground">/</span>
          <span
            v-if="currentTable"
            class="flex items-center gap-1 font-semibold text-primary"
          >
            <TableOutlined /> {{ currentTable.tableName }}
          </span>
        </div>
        <span class="text-xs text-muted-foreground font-mono">
          {{ datasourceName }}
        </span>
      </div>

      <!-- Error State -->
      <Alert
        v-if="errorMessage"
        :message="errorMessage"
        show-icon
        type="error"
      />

      <!-- Loading Spinner -->
      <Spin :spinning="loading" tip="正在探测读取元数据...">
        <!-- Step 1: Databases / Schemas List -->
        <div
          v-if="step === 'databases' && !loading"
          class="flex flex-col gap-3"
        >
          <div
            v-if="databases.length === 0 && !errorMessage"
            class="py-12 text-center"
          >
            <Empty description="未探测到任何数据库或 Schema" />
          </div>
          <div v-else class="overflow-hidden border border-border/70">
            <button
              v-for="(db, idx) in databases"
              :key="idx"
              class="flex w-full items-center justify-between border-b border-border/60 px-4 py-3 text-left last:border-b-0 hover:bg-accent/50"
              type="button"
              @click="selectDatabase(db)"
            >
              <div class="flex min-w-0 items-center gap-3">
                <DatabaseOutlined class="text-primary" />
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium">
                    {{ db.databaseName }}
                  </div>
                  <div class="truncate text-xs text-muted-foreground">
                    {{ db.remarks || '数据库实例' }}
                  </div>
                </div>
              </div>
              <RightOutlined class="text-xs text-muted-foreground" />
            </button>
          </div>
        </div>

        <!-- Step 2: Tables List -->
        <div
          v-else-if="step === 'tables' && !loading"
          class="flex flex-col gap-3"
        >
          <div class="flex items-center justify-between gap-4">
            <Input
              v-model:value="tableFilterText"
              placeholder="搜索表名或备注..."
              class="max-w-xs"
              allow-clear
            >
              <template #prefix>
                <SearchOutlined />
              </template>
            </Input>
            <span class="text-xs text-muted-foreground">
              共 {{ filteredTables.length }} 张表
            </span>
          </div>

          <div v-if="filteredTables.length === 0" class="py-12 text-center">
            <Empty description="未找到符合条件的表" />
          </div>
          <div
            v-else
            class="grid max-h-[420px] grid-cols-1 overflow-y-auto border border-border/70"
          >
            <div
              v-for="tbl in filteredTables"
              :key="tbl.tableName"
              class="flex cursor-pointer items-center justify-between border-b border-border/60 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-accent/50"
              @click="selectTable(tbl)"
            >
              <div class="flex items-center gap-3">
                <TableOutlined class="text-muted-foreground" />
                <div>
                  <span class="font-mono text-sm font-medium">
                    {{ tbl.tableName }}
                  </span>
                  <span
                    v-if="tbl.remarks"
                    class="ml-2 text-xs text-muted-foreground"
                  >
                    ({{ tbl.remarks }})
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground">
                  {{ tbl.tableType }}
                </span>
                <RightOutlined class="text-xs text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Columns Table -->
        <div
          v-else-if="step === 'columns' && !loading"
          class="flex flex-col gap-3"
        >
          <Table
            :data-source="columns"
            :columns="columnTableColumns"
            :pagination="false"
            row-key="columnName"
            size="small"
            bordered
            class="max-h-[440px] overflow-y-auto"
          >
            <template #bodyCell="{ column: col, record }">
              <template v-if="col.key === 'columnName'">
                <div class="flex items-center gap-1.5 font-mono">
                  <span>{{ record.columnName }}</span>
                  <KeyOutlined
                    v-if="record.primaryKey"
                    class="text-amber-500 text-xs"
                  />
                </div>
              </template>
              <template v-else-if="col.key === 'dataType'">
                <span class="font-mono text-xs">
                  {{ record.dataType }}
                </span>
              </template>
              <template v-else-if="col.key === 'nullable'">
                <span class="text-xs text-muted-foreground">
                  {{ record.nullable ? 'YES' : 'NO' }}
                </span>
              </template>
              <template v-else-if="col.key === 'primaryKey'">
                <span v-if="record.primaryKey" class="text-xs font-medium">PK 主键</span>
                <span v-else class="text-muted-foreground">-</span>
              </template>
              <template v-else-if="col.key === 'defaultValue'">
                <span
                  v-if="record.defaultValue !== null"
                  class="font-mono text-xs"
                >
                  {{ record.defaultValue }}
                </span>
                <span v-else class="text-muted-foreground">-</span>
              </template>
            </template>
          </Table>
        </div>
      </Spin>
    </div>
  </Modal>
</template>
