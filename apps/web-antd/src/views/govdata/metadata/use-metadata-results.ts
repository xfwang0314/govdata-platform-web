import type { ID, PageResult } from '#/api/common';
import type { MetadataAssetView } from '#/api/govdata/metadata/model';

import { ref } from 'vue';

export interface MetadataResultQuery {
  assetType: string;
  datasourceId: ID;
  keyword?: string;
  namespaceAssetId?: ID;
  pageNum: number;
  pageSize: number;
  technicalStatus?: string;
}
export function useMetadataResults(
  fetchPage: (
    query: MetadataResultQuery,
  ) => PromiseLike<PageResult<MetadataAssetView>>,
) {
  const rows = ref<MetadataAssetView[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const failed = ref(false);
  let version = 0;
  async function load(query?: MetadataResultQuery) {
    const current = ++version;
    failed.value = false;
    if (!query) {
      rows.value = [];
      total.value = 0;
      loading.value = false;
      return true;
    }
    loading.value = true;
    try {
      const page = await fetchPage(query);
      if (current !== version) return false;
      rows.value = page.rows;
      total.value = page.total;
      return true;
    } catch {
      if (current === version) {
        rows.value = [];
        total.value = 0;
        failed.value = true;
      }
      return false;
    } finally {
      if (current === version) loading.value = false;
    }
  }
  return { rows, total, loading, failed, load };
}
