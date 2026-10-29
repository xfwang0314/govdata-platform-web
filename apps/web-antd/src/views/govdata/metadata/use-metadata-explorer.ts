import type { ExplorerDatasource } from './explorer-navigation';

import type { ID } from '#/api/common';
import type {
  MetadataAssetTreeView,
  MetadataOptionsView,
} from '#/api/govdata/metadata/model';

import { computed, ref } from 'vue';

import { findAssetPath } from './explorer-navigation';

interface ExplorerServices {
  loadDatasources: () => Promise<ExplorerDatasource[]>;
  loadOptions: () => Promise<MetadataOptionsView>;
  loadTree: (id: ID) => PromiseLike<MetadataAssetTreeView[]>;
}

export function useMetadataExplorer(services: ExplorerServices) {
  const datasources = ref<ExplorerDatasource[]>([]);
  const options = ref<MetadataOptionsView>();
  const trees = ref<Record<string, MetadataAssetTreeView[]>>({});
  const failedDatasourceIds = ref<string[]>([]);
  const selectedDatasourceId = ref<ID>();
  const selectedAssetId = ref<ID>();
  const initializing = ref(false);
  const initializationFailed = ref(false);
  const loading = ref(false);
  const loadFailed = ref(false);
  const pending = new Map<string, Promise<void>>();
  let selectionVersion = 0;

  const nodes = computed(
    () => trees.value[String(selectedDatasourceId.value)] ?? [],
  );
  const path = computed(() =>
    selectedAssetId.value === undefined
      ? []
      : findAssetPath(nodes.value, selectedAssetId.value),
  );
  const selectedAsset = computed(() => path.value.at(-1));
  const selectedTable = computed(() =>
    path.value.find(
      (asset) => asset.assetType === 'TABLE' || asset.assetType === 'VIEW',
    ),
  );
  const selectedColumnId = computed(() =>
    selectedAsset.value?.assetType === 'COLUMN'
      ? selectedAsset.value.assetId
      : undefined,
  );
  const namespaceAssetId = computed(() => {
    const namespaces = path.value.filter(
      (asset) => asset.assetType === 'CATALOG' || asset.assetType === 'SCHEMA',
    );
    return namespaces.at(-1)?.assetId;
  });
  const breadcrumbs = computed(() => {
    const source = datasources.value.find(
      (item) =>
        String(item.datasourceId) === String(selectedDatasourceId.value),
    );
    return source
      ? [
          {
            key: `datasource:${source.datasourceId}`,
            label: source.datasourceName,
            datasourceId: source.datasourceId,
          },
          ...path.value.map((asset) => ({
            key: `asset:${asset.assetId}`,
            label: asset.displayName || asset.originalName,
            datasourceId: source.datasourceId,
            asset,
          })),
        ]
      : [];
  });

  function loadDatasource(id: ID, force = false): Promise<void> {
    const key = String(id);
    const active = pending.get(key);
    if (active) return active;
    if (!force && trees.value[key] !== undefined) return Promise.resolve();
    failedDatasourceIds.value = failedDatasourceIds.value.filter(
      (item) => item !== key,
    );
    if (force) {
      trees.value = Object.fromEntries(
        Object.entries(trees.value).filter(([id]) => id !== key),
      );
    }
    const request = Promise.resolve(services.loadTree(id))
      .then((result) => {
        trees.value = { ...trees.value, [key]: result };
      })
      .catch((error: unknown) => {
        failedDatasourceIds.value = [
          ...failedDatasourceIds.value.filter((item) => item !== key),
          key,
        ];
        throw error;
      })
      .finally(() => {
        pending.delete(key);
      });
    pending.set(key, request);
    return request;
  }

  async function select(id?: ID, asset?: MetadataAssetTreeView) {
    const version = ++selectionVersion;
    const cached =
      id !== undefined &&
      String(selectedDatasourceId.value) === String(id) &&
      trees.value[String(id)] !== undefined;
    selectedDatasourceId.value = id;
    selectedAssetId.value = asset?.assetId;
    loadFailed.value = false;
    if (cached) {
      loading.value = false;
      return true;
    }
    loading.value = true;
    try {
      if (id !== undefined) await loadDatasource(id);
      return version === selectionVersion;
    } catch {
      if (version === selectionVersion) loadFailed.value = true;
      return false;
    } finally {
      if (version === selectionVersion) loading.value = false;
    }
  }

  async function initialize() {
    initializing.value = true;
    initializationFailed.value = false;
    try {
      const [loadedOptions, sources] = await Promise.all([
        services.loadOptions(),
        services.loadDatasources(),
      ]);
      options.value = loadedOptions;
      datasources.value = sources;
      await select(sources[0]?.datasourceId);
    } catch {
      initializationFailed.value = true;
    } finally {
      initializing.value = false;
    }
  }

  async function refresh() {
    const id = selectedDatasourceId.value;
    if (id === undefined || loading.value) return;
    const version = ++selectionVersion;
    loading.value = true;
    loadFailed.value = false;
    try {
      await loadDatasource(id, true);
      if (
        version === selectionVersion &&
        selectedAssetId.value !== undefined &&
        path.value.length === 0
      ) {
        selectedAssetId.value = undefined;
      }
    } catch {
      if (version === selectionVersion) loadFailed.value = true;
    } finally {
      if (version === selectionVersion) loading.value = false;
    }
  }

  return {
    breadcrumbs,
    datasources,
    failedDatasourceIds,
    initializationFailed,
    initializing,
    loadDatasource,
    loadFailed,
    loading,
    namespaceAssetId,
    nodes,
    options,
    path,
    selectedAsset,
    selectedAssetId,
    selectedColumnId,
    selectedDatasourceId,
    selectedTable,
    trees,
    initialize,
    refresh,
    select,
  };
}
