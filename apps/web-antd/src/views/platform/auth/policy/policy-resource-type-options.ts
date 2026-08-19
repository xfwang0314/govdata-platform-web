import type {
  ResourceAuthorizationCapability,
  ResourceTypeItem,
} from '#/api/platform/auth/model';

export interface ResourceTypeTreeOption {
  children?: ResourceTypeTreeOption[];
  disabled?: boolean;
  label: string;
  selectable?: boolean;
  value: string;
}

export function buildPolicyResourceTypeTree(
  resourceTypes: ResourceTypeItem[],
  capability: ResourceAuthorizationCapability = 'CUSTOM_POLICY',
): ResourceTypeTreeOption[] {
  const filtered = (resourceTypes || []).filter((item) =>
    item.capabilities.includes(capability),
  );
  const moduleMap = new Map<string, ResourceTypeTreeOption>();
  for (const item of filtered) {
    const moduleKey = item.sourceModule || 'unknown';
    let group = moduleMap.get(moduleKey);
    if (!group) {
      group = {
        children: [],
        disabled: true,
        label: item.moduleLabel || item.sourceModule,
        selectable: false,
        value: `module-${moduleKey}`,
      };
      moduleMap.set(moduleKey, group);
    }
    group.children?.push({
      label: item.typeLabel,
      value: item.typeCode,
    });
  }
  return [...moduleMap.values()];
}

export function buildPolicyResourceTypeOptions(
  resourceTypes: ResourceTypeItem[],
) {
  return (resourceTypes || [])
    .filter((item) => item.capabilities.includes('CUSTOM_POLICY'))
    .map((item) => ({
      label: `${item.moduleLabel} / ${item.typeLabel}`,
      value: item.typeCode,
    }));
}
