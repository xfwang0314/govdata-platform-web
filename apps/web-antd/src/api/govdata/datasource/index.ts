import type {
  ConnectionTestView,
  ConnectorDescriptor,
  DatabaseView,
  DataSourceCommand,
  DataSourceOptionsView,
  DataSourceView,
  SecretReference,
  TableSchemaView,
  TableView,
} from './model';

import type { ID, PageQuery, PageResult } from '#/api/common';

import { alovaInstance } from '#/utils/http';

const BASE_URL = '/govdata/datasources';

export function getDataSourcePageApi(params: PageQuery) {
  return alovaInstance.get<PageResult<DataSourceView>>(BASE_URL, { params });
}

export function getConnectorsApi() {
  return alovaInstance.get<ConnectorDescriptor[]>(`${BASE_URL}/connectors`);
}

export function getDataSourceOptionsApi() {
  return alovaInstance.get<DataSourceOptionsView>(`${BASE_URL}/options`);
}

export function getSecretReferencesApi(connectorCode: string) {
  return alovaInstance.get<SecretReference[]>(`${BASE_URL}/secret-references`, {
    params: { connectorCode },
  });
}

export function getDataSourceApi(id: ID) {
  return alovaInstance.get<DataSourceView>(`${BASE_URL}/${id}`);
}

export function createDataSourceApi(data: DataSourceCommand) {
  return alovaInstance.post<DataSourceView>(BASE_URL, data);
}

export function updateDataSourceApi(id: ID, data: DataSourceCommand) {
  return alovaInstance.put<DataSourceView>(`${BASE_URL}/${id}`, data);
}

export function testDataSourceConnectionApi(id: ID) {
  return alovaInstance.post<ConnectionTestView>(
    `${BASE_URL}/${id}/connection-tests`,
    undefined,
  );
}

export function getDataSourceTestHistoryApi(id: ID, params: PageQuery) {
  return alovaInstance.get<PageResult<ConnectionTestView>>(
    `${BASE_URL}/${id}/connection-tests`,
    { params },
  );
}

export function enableDataSourceApi(id: ID) {
  return alovaInstance.put<DataSourceView>(`${BASE_URL}/${id}/enable`);
}

export function disableDataSourceApi(id: ID) {
  return alovaInstance.put<DataSourceView>(`${BASE_URL}/${id}/disable`);
}

export function deleteDataSourceApi(id: ID) {
  return alovaInstance.delete<void>(`${BASE_URL}/${id}`);
}

export function getDataSourceDatabasesApi(id: ID) {
  return alovaInstance.get<DatabaseView[]>(
    `${BASE_URL}/${id}/metadata/databases`,
  );
}

export function getDataSourceTablesApi(
  id: ID,
  params?: {
    catalog?: string;
    limit?: number;
    offset?: number;
    schema?: string;
    tableNamePattern?: string;
    tableType?: string;
  },
) {
  return alovaInstance.get<TableView[]>(`${BASE_URL}/${id}/metadata/tables`, {
    params,
  });
}

export function inspectDataSourceColumnsApi(
  id: ID,
  tableNames: string[],
  catalog?: string,
  schema?: string,
) {
  return alovaInstance.post<TableSchemaView[]>(
    `${BASE_URL}/${id}/metadata/columns`,
    tableNames,
    {
      params: { catalog, schema },
    },
  );
}
