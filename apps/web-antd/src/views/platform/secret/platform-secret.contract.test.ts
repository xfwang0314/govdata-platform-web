import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function source(fileName: string) {
  return readFileSync(new URL(fileName, import.meta.url), 'utf8');
}

describe('platform secret page contracts', () => {
  it('provides an explicit click target for complete purpose scope', () => {
    const page = source('./index.vue');

    expect(page).toContain('<Popover');
    expect(page).toContain('查看全部');
  });

  it('uses the same query permission for both detail entry points', () => {
    const page = source('./index.vue');

    expect(page).toContain('const canQuerySecret');
    expect(page).toContain('v-if="canQuerySecret"');
  });

  it('always releases modal loading while preparing rotation', () => {
    const modal = source('./components/secret-rotate-modal.vue');

    expect(modal).toContain('modalApi.modalLoading(true)');
    expect(modal).toContain('finally');
    expect(modal).toContain('modalApi.modalLoading(false)');
  });

  it('keeps the rotation form mounted while its record is loading', () => {
    const modal = source('./components/secret-rotate-modal.vue');

    expect(modal).not.toContain('<div v-if="current" class="space-y-5 py-1">');
  });

  it('does not repeat informational alert bars in ordinary secret dialogs', () => {
    const createModal = source('./components/secret-create-modal.vue');
    const editModal = source('./components/secret-edit-modal.vue');
    const detailDrawer = source('./components/secret-detail-drawer.vue');

    expect(createModal).not.toContain('<Alert');
    expect(editModal).not.toContain('<Alert');
    expect(detailDrawer).not.toContain('<Alert');
  });

  it('renders detail without an action footer and releases drawer loading', () => {
    const drawer = source('./components/secret-detail-drawer.vue');

    expect(drawer).toContain(':footer="false"');
    expect(drawer).toContain('drawerApi.drawerLoading(true)');
    expect(drawer).toContain('finally');
  });

  it('uses the Descriptions item contract supported by antdv-next', () => {
    const drawer = source('./components/secret-detail-drawer.vue');

    expect(drawer).toContain('content:');
    expect(drawer).not.toContain('children:');
  });

  it('exposes the optional description across secret management views', () => {
    const model = source('../../../api/platform/secret/model.d.ts');
    const page = source('./index.vue');
    const createModal = source('./components/secret-create-modal.vue');
    const editModal = source('./components/secret-edit-modal.vue');
    const detailDrawer = source('./components/secret-detail-drawer.vue');

    expect(model).toContain('description: null | string');
    expect(page).toContain('row.description');
    expect(createModal).toContain("fieldName: 'description'");
    expect(editModal).toContain("fieldName: 'description'");
    expect(detailDrawer).toContain("label: '凭据描述'");
  });
});
