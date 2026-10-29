import type { ID } from '#/api/common';
import type { MetadataAssetTreeView } from '#/api/govdata/metadata/model';

/** 根据实际采集层级生成筛选项，不按数据库产品虚构可选层级。 */
export function namespaceOptions(
  nodes: MetadataAssetTreeView[],
  type: string,
  catalogId?: ID,
): { label: string; value: ID }[] {
  const result: { label: string; value: ID }[] = [];
  function visit(items: MetadataAssetTreeView[], catalog?: ID, path = '') {
    for (const item of items) {
      if (item.assetType !== 'CATALOG' && item.assetType !== 'SCHEMA') continue;
      const owner = item.assetType === 'CATALOG' ? item.assetId : catalog;
      const label = path ? `${path} / ${item.originalName}` : item.originalName;
      if (
        item.assetType === type &&
        (catalogId === undefined || String(owner) === String(catalogId))
      ) {
        result.push({ label, value: item.assetId });
      }
      visit(item.children ?? [], owner, label);
    }
  }
  visit(nodes);
  return result;
}

export function namespacePath(nodes: MetadataAssetTreeView[], id: ID | null) {
  return [
    ...namespaceOptions(nodes, 'CATALOG'),
    ...namespaceOptions(nodes, 'SCHEMA'),
  ].find((item) => String(item.value) === String(id))?.label;
}
