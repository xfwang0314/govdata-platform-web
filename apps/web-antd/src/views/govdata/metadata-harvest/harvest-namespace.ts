import type { DatabaseView } from '#/api/govdata/datasource/model';

export interface NamespaceOption {
  label: string;
  value: string;
}

export function buildDatabaseOptions(
  namespaces: DatabaseView[],
  currentCatalog?: string,
): NamespaceOption[] {
  const values = new Map<string, string>();
  for (const item of namespaces) {
    const value = item.catalog ?? (item.schema ? undefined : item.databaseName);
    if (value) values.set(value, item.databaseName || value);
  }
  const schemaOnly = namespaces.some((item) => !item.catalog && item.schema);
  if (currentCatalog && !schemaOnly && !values.has(currentCatalog)) {
    values.set(currentCatalog, currentCatalog);
  }
  return [...values].map(([value, label]) => ({ label, value }));
}

export function buildSchemaOptions(
  namespaces: DatabaseView[],
  discoveredSchemas: string[],
  currentSchema?: string,
): NamespaceOption[] {
  const values = new Set([
    ...namespaces.flatMap((item) => (item.schema ? [item.schema] : [])),
    ...discoveredSchemas,
  ]);
  if (currentSchema) values.add(currentSchema);
  return [...values]
    .toSorted((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value }));
}
