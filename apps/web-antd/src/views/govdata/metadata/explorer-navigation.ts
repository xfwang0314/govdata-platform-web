import type { ID } from '#/api/common';
import type { MetadataAssetTreeView } from '#/api/govdata/metadata/model';

export interface ExplorerDatasource {
  connectorCode: string;
  datasourceId: ID;
  datasourceName: string;
}

export interface ExplorerNode {
  asset?: MetadataAssetTreeView;
  assetType?: string;
  count?: number;
  children: ExplorerNode[];
  datasourceId?: ID;
  isLeaf: boolean;
  key: string;
  kind:
    | 'asset'
    | 'category'
    | 'connector'
    | 'database'
    | 'datasource'
    | 'empty'
    | 'error';
  originalName: string;
  selectable: boolean;
  title: string;
}

export function datasourceNodeKey(id: ID) {
  return `datasource:${id}`;
}

export function assetNodeKey(id: ID) {
  return `asset:${id}`;
}

export function categoryNodeKey(
  datasourceId: ID,
  namespaceId: ID | undefined,
  type: string,
) {
  return `category:${datasourceId}:${namespaceId ?? 'root'}:${type}`;
}

/** 分类数量仅从已获授权的目录树计算；未加载连接不虚报全局数量。 */
export function buildExplorerTree(
  datasources: ExplorerDatasource[],
  trees: Record<string, MetadataAssetTreeView[]>,
  failedIds: string[],
): ExplorerNode[] {
  function count(nodes: MetadataAssetTreeView[], type: string): number {
    return nodes.reduce(
      (total, node) =>
        total +
        (node.assetType === type ? 1 : 0) +
        count(node.children ?? [], type),
      0,
    );
  }
  function categories(
    nodes: MetadataAssetTreeView[],
    id: ID,
    namespace?: MetadataAssetTreeView,
  ): ExplorerNode[] {
    return ['TABLE', 'COLUMN'].map((type) => ({
      asset: namespace,
      assetType: type,
      children: [],
      datasourceId: id,
      isLeaf: true,
      key: categoryNodeKey(id, namespace?.assetId, type),
      kind: 'category',
      originalName: type,
      selectable: true,
      title: type === 'COLUMN' ? '列' : '数据表',
      count: count(nodes, type),
    }));
  }
  function namespaces(nodes: MetadataAssetTreeView[], id: ID): ExplorerNode[] {
    return nodes
      .filter(
        (node) => node.assetType === 'CATALOG' || node.assetType === 'SCHEMA',
      )
      .map((asset) => ({
        asset,
        children: [
          ...namespaces(asset.children ?? [], id),
          ...categories(asset.children ?? [], id, asset),
        ],
        datasourceId: id,
        isLeaf: false,
        key: assetNodeKey(asset.assetId),
        kind: 'asset',
        originalName: asset.originalName,
        selectable: true,
        title: asset.displayName || asset.originalName,
        count: count(asset.children ?? [], 'TABLE'),
      }));
  }
  function sourceNode(source: ExplorerDatasource): ExplorerNode {
    const key = String(source.datasourceId);
    const nodes = trees[key];
    const children = namespaces(nodes ?? [], source.datasourceId);
    if (
      nodes &&
      (children.length === 0 ||
        nodes.some((node) => node.assetType === 'TABLE'))
    )
      children.push(...categories(nodes, source.datasourceId));
    if (failedIds.includes(key))
      children.push({
        children: [],
        datasourceId: source.datasourceId,
        isLeaf: true,
        key: `error:${key}`,
        kind: 'error',
        originalName: '',
        selectable: false,
        title: '加载失败，点击重试',
      });
    return {
      children,
      datasourceId: source.datasourceId,
      isLeaf: false,
      key: datasourceNodeKey(source.datasourceId),
      kind: 'datasource',
      originalName: source.connectorCode,
      selectable: true,
      title: source.datasourceName,
      count: nodes ? count(nodes, 'TABLE') : undefined,
    };
  }
  const connectors = [
    ...new Set(datasources.map((source) => source.connectorCode)),
  ];
  return [
    {
      children: connectors.map((code) => {
        const sources = datasources.filter(
          (source) => source.connectorCode === code,
        );
        const loaded = sources.every(
          (source) => trees[String(source.datasourceId)] !== undefined,
        );
        return {
          children: sources.map((source) => sourceNode(source)),
          isLeaf: false,
          key: `connector:${code}`,
          kind: 'connector',
          originalName: code,
          selectable: false,
          title: code,
          count: loaded
            ? sources.reduce(
                (total, source) =>
                  total +
                  count(trees[String(source.datasourceId)] ?? [], 'TABLE'),
                0,
              )
            : undefined,
        };
      }),
      isLeaf: datasources.length === 0,
      key: 'databases',
      kind: 'database',
      originalName: '',
      selectable: false,
      title: '数据库',
      count: datasources.length,
    },
  ];
}

/** 搜索保留祖先路径；不触发未展开连接的采集或后台查询。 */
export function filterExplorerTree(
  nodes: ExplorerNode[],
  keyword: string,
): ExplorerNode[] {
  const search = keyword.trim().toLocaleLowerCase();
  if (!search) return nodes;
  return nodes.flatMap((node) => {
    if (
      `${node.title} ${node.originalName}`.toLocaleLowerCase().includes(search)
    )
      return [node];
    const children = filterExplorerTree(node.children, search);
    return children.length > 0 ? [{ ...node, children }] : [];
  });
}

export function findExplorerNode(
  nodes: ExplorerNode[],
  key: string,
): ExplorerNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    const found = findExplorerNode(node.children, key);
    if (found) return found;
  }
}

export function explorerParentKeys(nodes: ExplorerNode[]): string[] {
  return nodes.flatMap((node) =>
    node.children.length > 0
      ? [node.key, ...explorerParentKeys(node.children)]
      : [],
  );
}

/** 返回真实资产路径；列选择沿路径找到所属表，不把列ID当成表ID。 */
export function findAssetPath(
  nodes: MetadataAssetTreeView[],
  id: ID,
): MetadataAssetTreeView[] {
  for (const node of nodes) {
    if (String(node.assetId) === String(id)) return [node];
    const children = findAssetPath(node.children ?? [], id);
    if (children.length > 0) return [node, ...children];
  }
  return [];
}
