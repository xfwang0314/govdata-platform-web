import type { DatabaseView } from '#/api/govdata/datasource/model';

import { describe, expect, it } from 'vitest';

import { buildDatabaseOptions, buildSchemaOptions } from './harvest-namespace';

function namespace(
  catalog: null | string,
  schema: null | string,
  databaseName: string,
): DatabaseView {
  return { catalog, databaseName, remarks: null, schema };
}

describe('采集命名空间层级', () => {
  it('oracle只展示Schema，不把Schema重复映射为数据库', () => {
    const oracle = [namespace(null, 'DEV_TEST', 'DEV_TEST')];

    expect(buildDatabaseOptions(oracle)).toEqual([]);
    expect(buildDatabaseOptions(oracle, 'DEV_TEST')).toEqual([]);
    expect(buildSchemaOptions(oracle, [])).toEqual([
      { label: 'DEV_TEST', value: 'DEV_TEST' },
    ]);
  });

  it('mysql展示数据库但不生成同名Schema', () => {
    const mysql = [namespace('govdata', null, 'govdata')];

    expect(buildDatabaseOptions(mysql)).toEqual([
      { label: 'govdata', value: 'govdata' },
    ]);
    expect(buildSchemaOptions(mysql, [])).toEqual([]);
  });

  it('postgresql同时展示数据库与探测到的Schema', () => {
    const postgresql = [namespace('govdata', null, 'govdata')];

    expect(buildDatabaseOptions(postgresql)).toEqual([
      { label: 'govdata', value: 'govdata' },
    ]);
    expect(buildSchemaOptions(postgresql, ['public'])).toEqual([
      { label: 'public', value: 'public' },
    ]);
  });
});
