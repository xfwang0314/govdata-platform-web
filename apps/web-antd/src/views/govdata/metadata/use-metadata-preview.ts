import type { ID } from '#/api/common';
import type {
  MetadataAssetView,
  MetadataColumnView,
} from '#/api/govdata/metadata/model';

import { ref } from 'vue';

export function useMetadataPreview(
  loadAsset: (id: ID) => PromiseLike<MetadataAssetView>,
) {
  const detail = ref<MetadataAssetView>();
  const parentTable = ref<MetadataAssetView>();
  const field = ref<MetadataColumnView>();
  const loading = ref(false);
  const failed = ref(false);
  let version = 0;
  async function select(row?: MetadataAssetView) {
    const current = ++version;
    detail.value = undefined;
    parentTable.value = undefined;
    field.value = undefined;
    failed.value = false;
    if (!row) {
      loading.value = false;
      return;
    }
    loading.value = true;
    try {
      const asset = await loadAsset(row.assetId);
      if (current !== version) return;
      let parent: MetadataAssetView | undefined;
      if (asset.assetType === 'COLUMN' && asset.parentAssetId !== null)
        parent = await loadAsset(asset.parentAssetId);
      if (current !== version) return;
      detail.value = asset;
      parentTable.value = parent;
      field.value = parent?.columns.find(
        (column) => String(column.assetId) === String(asset.assetId),
      );
    } catch {
      if (current === version) failed.value = true;
    } finally {
      if (current === version) loading.value = false;
    }
  }
  return { detail, parentTable, field, loading, failed, select };
}
