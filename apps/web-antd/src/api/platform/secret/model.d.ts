import type { ID } from '#/api/common';

export type SecretStatus = 'ACTIVE' | 'DISABLED';
export type SecretType =
  | 'API_KEY'
  | 'KEY_VALUE'
  | 'OAUTH2_CLIENT'
  | 'PASSWORD'
  | 'SSH_PRIVATE_KEY'
  | 'TOKEN'
  | 'USERNAME_PASSWORD';

export interface SecretOption {
  label: string;
  value: string;
}

export interface SecretOptions {
  ownerModules: SecretOwnerModuleOption[];
  secretTypes: SecretTypeOption[];
  statuses: SecretOption[];
}

export interface SecretFieldDefinition {
  code: string;
  inputType: 'PASSWORD' | 'SECRET_TEXTAREA' | 'TEXT';
  label: string;
  maxLength: number;
  required: boolean;
}

export interface SecretTypeOption extends SecretOption {
  dynamicFieldsAllowed: boolean;
  fields: SecretFieldDefinition[];
  value: SecretType;
}

export interface SecretOwnerModuleOption extends SecretOption {
  purposes: SecretOption[];
}

/** 脱敏凭据视图。后端不会在此结构中返回任何凭据值。 */
export interface SecretView {
  configured: boolean;
  createTime: string;
  currentVersionNo: number;
  description: null | string;
  expireTime: null | string;
  lockVersion: number;
  ownerModule: string;
  purposeScope: string;
  secretId: ID;
  secretName: string;
  secretRef: string;
  secretType: SecretType;
  status: SecretStatus;
  updateTime: string;
}

export interface SecretCreateCommand {
  description?: null | string;
  expireTime?: null | string;
  ownerModule: string;
  purposeScope: string;
  secretName: string;
  secretType: SecretType;
  values: Record<string, string>;
}

export interface SecretRotateCommand {
  expireTime?: null | string;
  lockVersion: number;
  values: Record<string, string>;
}

export interface SecretUpdateCommand {
  description?: null | string;
  expireTime?: null | string;
  lockVersion: number;
  purposeScope: string;
  secretName: string;
}
