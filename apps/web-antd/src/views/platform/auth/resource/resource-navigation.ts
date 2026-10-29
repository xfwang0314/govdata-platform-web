import type {
  ResourceCategoryItem,
  ResourceDirectoryNode,
} from '#/api/platform/auth/model';

export interface ResourceNavigationNode {
  children?: ResourceNavigationNode[];
  categoryCode?: string;
  isLeaf?: boolean;
  key: string;
  resourceId?: string;
  selectable?: boolean;
  title: string;
}

export interface ResourceNavigationFilter {
  resourceId?: string;
  resourceType?: string;
  sourceModule?: string;
}

export function buildResourceNavigation(
  resourceCategories: ResourceCategoryItem[],
): ResourceNavigationNode[] {
  const categories: ResourceNavigationNode[] = [];
  for (const category of resourceCategories.toSorted(
    (left, right) => left.order - right.order,
  )) {
    categories.push({
      categoryCode: category.code,
      isLeaf: false,
      key: `category:${category.code}`,
      selectable: false,
      title: category.label,
    });
  }
  return categories;
}

export function buildResourceDirectoryNodes(
  resources: ResourceDirectoryNode[],
): ResourceNavigationNode[] {
  return resources.map((resource) => ({
    isLeaf: resource.leaf,
    key: `resource:${resource.id}`,
    resourceId: String(resource.id),
    title: resource.label,
  }));
}

export async function buildLoadedResourceNavigation(
  resourceCategories: ResourceCategoryItem[],
  loadRoots: (categoryCode: string) => Promise<ResourceDirectoryNode[]>,
): Promise<ResourceNavigationNode[]> {
  const categories = buildResourceNavigation(resourceCategories);
  await Promise.all(
    categories.map(async (category) => {
      if (!category.categoryCode) return;
      category.children = buildResourceDirectoryNodes(
        await loadRoots(category.categoryCode),
      );
    }),
  );
  return categories;
}

export function filterResourceNavigation(
  nodes: ResourceNavigationNode[],
  keyword: string,
): ResourceNavigationNode[] {
  const normalized = keyword.trim().toLocaleLowerCase();
  if (!normalized) {
    return nodes;
  }
  return nodes.flatMap((node): ResourceNavigationNode[] => {
    if (
      node.title.toLocaleLowerCase().includes(normalized) ||
      node.key.toLocaleLowerCase().includes(normalized)
    ) {
      return [node];
    }
    const children = filterResourceNavigation(node.children ?? [], keyword);
    return children.length > 0 ? [{ ...node, children }] : [];
  });
}

export function resolveResourceNavigationFilter(
  key: string,
): ResourceNavigationFilter {
  if (key.startsWith('resource:')) {
    return { resourceId: key.slice(9) };
  }
  if (key.startsWith('module:')) {
    return { resourceType: undefined, sourceModule: key.slice(7) };
  }
  if (key.startsWith('type:')) {
    const value = key.slice(5);
    const separator = value.indexOf(':');
    if (separator > 0) {
      return {
        resourceType: value.slice(separator + 1),
        sourceModule: value.slice(0, separator),
      };
    }
  }
  return { resourceType: undefined, sourceModule: undefined };
}
