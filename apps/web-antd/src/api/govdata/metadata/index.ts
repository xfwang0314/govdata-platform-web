import type {
  MetadataAssetTreeView,
  MetadataAssetView,
  MetadataChangeIssueView,
  MetadataGovernanceCommand,
  MetadataImpactView,
  MetadataOptionsView,
  MetadataTableRevisionView,
} from './model';

import type { ID, PageQuery, PageResult } from '#/api/common';

import { alovaInstance } from '#/utils/http';

const BASE_URL = '/govdata/metadata';

export function getMetadataAssetPageApi(params: PageQuery) {
  return alovaInstance.get<PageResult<MetadataAssetView>>(
    `${BASE_URL}/assets`,
    {
      params,
    },
  );
}

export function getMetadataAssetApi(id: ID) {
  return alovaInstance.get<MetadataAssetView>(`${BASE_URL}/assets/${id}`);
}

export function updateMetadataGovernanceApi(
  id: ID,
  command: MetadataGovernanceCommand,
) {
  return alovaInstance.put<MetadataAssetView>(
    `${BASE_URL}/assets/${id}/governance`,
    command,
  );
}

export function getMetadataImpactPageApi(id: ID, params: PageQuery) {
  return alovaInstance.get<PageResult<MetadataImpactView>>(
    `${BASE_URL}/assets/${id}/impacts`,
    { params },
  );
}

/** 查询单个数据源下经过授权裁剪的元数据层级。 */
export function getMetadataAssetTreeApi(datasourceId: ID) {
  return alovaInstance.get<MetadataAssetTreeView[]>(`${BASE_URL}/assets/tree`, {
    params: { datasourceId },
  });
}

/** 仅返回数据库命名空间层级，供 Catalog/Schema 筛选使用。 */
export function getMetadataNamespaceTreeApi(datasourceId: ID) {
  return alovaInstance.get<MetadataAssetTreeView[]>(
    `${BASE_URL}/assets/namespaces`,
    { params: { datasourceId } },
  );
}

export function getMetadataRevisionPageApi(
  tableAssetId: ID,
  params: PageQuery,
) {
  return alovaInstance.get<PageResult<MetadataTableRevisionView>>(
    `${BASE_URL}/tables/${tableAssetId}/revisions`,
    { params },
  );
}

export function getMetadataRevisionApi(tableAssetId: ID, revisionId: ID) {
  return alovaInstance.get<MetadataTableRevisionView>(
    `${BASE_URL}/tables/${tableAssetId}/revisions/${revisionId}`,
  );
}

export function getMetadataChangeIssuePageApi(
  tableAssetId: ID,
  params: PageQuery,
) {
  return alovaInstance.get<PageResult<MetadataChangeIssueView>>(
    `${BASE_URL}/tables/${tableAssetId}/change-issues`,
    { params },
  );
}

export function updateMetadataChangeIssueStatusApi(
  id: ID,
  issueStatus: string,
) {
  return alovaInstance.put<MetadataChangeIssueView>(
    `${BASE_URL}/change-issues/${id}/status`,
    { issueStatus },
  );
}

export function getMetadataOptionsApi() {
  return alovaInstance.get<MetadataOptionsView>(`${BASE_URL}/options`);
}
