import type { ResourceTypeItem } from '#/api/platform/auth/model';

export interface ResourceNavigationNode {
  children?: ResourceNavigationNode[];
  key: string;
  title: string;
}

export interface ResourceNavigationFilter {
  resourceType?: string;
  sourceModule?: string;
}

export function buildResourceNavigation(
  resourceTypes: ResourceTypeItem[],
): ResourceNavigationNode[] {
  const modules = new Map<string, ResourceNavigationNode>();
  for (const type of resourceTypes) {
    let moduleNode = modules.get(type.sourceModule);
    if (!moduleNode) {
      moduleNode = {
        children: [],
        key: `module:${type.sourceModule}`,
        title: type.moduleLabel,
      };
      modules.set(type.sourceModule, moduleNode);
    }
    moduleNode.children?.push({
      key: `type:${type.sourceModule}:${type.typeCode}`,
      title: type.typeLabel,
    });
  }
  return [...modules.values()];
}

export function filterResourceNavigation(
  nodes: ResourceNavigationNode[],
  keyword: string,
): ResourceNavigationNode[] {
  const normalized = keyword.trim().toLocaleLowerCase();
  if (!normalized) {
    return nodes;
  }
  return nodes.flatMap((node) => {
    if (
      node.title.toLocaleLowerCase().includes(normalized) ||
      node.key.toLocaleLowerCase().includes(normalized)
    ) {
      return [node];
    }
    const children = (node.children ?? []).filter(
      (child) =>
        child.title.toLocaleLowerCase().includes(normalized) ||
        child.key.toLocaleLowerCase().includes(normalized),
    );
    return children.length > 0 ? [{ ...node, children }] : [];
  });
}

export function resolveResourceNavigationFilter(
  key: string,
): ResourceNavigationFilter {
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
