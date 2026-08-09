import type { ID } from '#/api/common';

export type DataSourceEnvironment = 'DEV' | 'PROD' | 'TEST';
export type DataSourceStatus = 'ACTIVE' | 'DISABLED';
export type ConnectionTestStatus = 'FAILED' | 'NOT_TESTED' | 'SUCCESS';

export interface OptionView {
  label: string;
  value: number | string;
}

export interface DataSourceOptionsView {
  accessModes: OptionView[];
  classifications: OptionView[];
  connectionTestReasons: OptionView[];
  environments: OptionView[];
  securityLevels: OptionView[];
  statuses: OptionView[];
  testStatuses: OptionView[];
}

export interface ConnectorAuthProfile {
  profileCode: string;
  profileName: string;
  requiredKeys: string[];
  secretType: null | string;
}

export interface ConnectorDescriptor {
  authProfiles: ConnectorAuthProfile[];
  capabilities: string[];
  category: string;
  connectionPreview?: ConnectorPreviewDescriptor;
  customPropertiesSupported: boolean;
  connectorCode: string;
  connectorName: string;
  connectorVersion: string;
  endpointFields: ConnectorFieldDescriptor[];
}

export interface ConnectorPreviewDescriptor {
  label: string;
  template: string;
}

export interface ConnectorFieldDescriptor {
  authProfileCodes: string[];
  code: string;
  defaultValue: boolean | null | number | string;
  description: null | string;
  label: string;
  maxValue: null | number;
  minValue: null | number;
  options: string[];
  required: boolean;
  valueType: 'BOOLEAN' | 'ENUM' | 'INTEGER' | 'STRING';
}

export interface SecretReference {
  expireTime: null | string;
  secretName: string;
  secretRef: null | string;
  secretType: string;
}

export interface DataSourceEndpointConfig {
  [key: string]: unknown;
  connectionTarget?: string;
  properties: Record<string, string>;
}

export interface DataSourceView {
  accessMode: string;
  authProfileCode: string;
  authzResourceId: ID | null;
  classificationCode: string;
  connectorCode: string;
  connectorVersion: string;
  createTime: string;
  datasourceCode: string;
  datasourceId: ID;
  datasourceName: string;
  endpointConfig: DataSourceEndpointConfig;
  environment: DataSourceEnvironment;
  lastTestStatus: ConnectionTestStatus;
  lastTestTime: null | string;
  lockVersion: number;
  ownerDeptId: ID;
  secretRef?: null | string;
  securityLevel: number;
  status: DataSourceStatus;
  updateTime: string;
}

export interface DataSourceCommand {
  accessMode: string;
  authProfileCode: string;
  classificationCode: string;
  connectorCode: string;
  datasourceName: string;
  endpointConfig: DataSourceEndpointConfig;
  environment: DataSourceEnvironment;
  lockVersion?: number;
  ownerDeptId: ID;
  secretRef: null | string;
  securityLevel: number;
}

export interface ConnectionTestView {
  datasourceId: ID;
  latencyMs: number;
  message: null | string;
  occurredTime: string;
  reasonCode: string;
  result: 'FAILED' | 'SUCCESS';
  serverInfo: Record<string, unknown>;
  testId: ID;
}

export interface DatabaseView {
  catalog: null | string;
  databaseName: string;
  remarks: null | string;
  schema: null | string;
}

export interface TableView {
  catalog: null | string;
  remarks: null | string;
  schema: null | string;
  tableName: string;
  tableType: string;
}

export interface ColumnView {
  columnName: string;
  columnSize: number;
  dataType: string;
  decimalDigits: number;
  defaultValue: null | string;
  jdbcType: number;
  nullable: boolean;
  ordinalPosition: number;
  primaryKey: boolean;
  remarks: null | string;
}

export interface TableSchemaView {
  columns: ColumnView[];
  table: TableView;
}
