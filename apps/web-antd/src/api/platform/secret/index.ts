import type {
  SecretCreateCommand,
  SecretOptions,
  SecretRotateCommand,
  SecretUpdateCommand,
  SecretView,
} from './model';

import type { ID, PageQuery, PageResult } from '#/api/common';

import { alovaInstance } from '#/utils/http';

const BASE_URL = '/platform/secrets';

export function getSecretPageApi(params: PageQuery) {
  return alovaInstance.get<PageResult<SecretView>>(BASE_URL, { params });
}

export function getSecretOptionsApi() {
  return alovaInstance.get<SecretOptions>(`${BASE_URL}/options`);
}

export function getSecretApi(secretId: ID) {
  return alovaInstance.get<SecretView>(`${BASE_URL}/${secretId}`);
}

export function createSecretApi(data: SecretCreateCommand) {
  return alovaInstance.post<SecretView>(BASE_URL, data);
}

export function updateSecretApi(secretId: ID, data: SecretUpdateCommand) {
  return alovaInstance.put<SecretView>(`${BASE_URL}/${secretId}`, data);
}

export function rotateSecretApi(secretId: ID, data: SecretRotateCommand) {
  return alovaInstance.post<SecretView>(`${BASE_URL}/${secretId}/rotate`, data);
}

export function enableSecretApi(secretId: ID) {
  return alovaInstance.put<SecretView>(`${BASE_URL}/${secretId}/enable`);
}

export function disableSecretApi(secretId: ID) {
  return alovaInstance.put<SecretView>(`${BASE_URL}/${secretId}/disable`);
}
