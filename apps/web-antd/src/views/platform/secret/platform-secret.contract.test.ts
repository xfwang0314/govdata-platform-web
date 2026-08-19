import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function source(fileName: string) {
  return readFileSync(new URL(fileName, import.meta.url), 'utf8');
}

describe('platform secret page contracts', () => {
  it('uses a compact credential directory summary driven by backend options', () => {
    const page = source('./index.vue');
    const summaryCard = source('./components/secret-summary-card.vue');
    const tableComponent = source('./components/secret-table.vue');

    expect(summaryCard).toContain('平台凭据保险库');
    expect(page).toContain('secretTypeCount');
    expect(page).toContain('ownerModuleCount');
    expect(tableComponent).toContain('table-title="凭据目录"');
  });

  it('preserves create, detail, edit, rotate and status operations', () => {
    const page = source('./index.vue');
    const tableComponent = source('./components/secret-table.vue');

    expect(page).toContain('handleAdd');
    expect(page).toContain('handleDetail(row: SecretView)');
    expect(page).toContain('handleEdit(row: SecretView)');
    expect(page).toContain('handleRotate(row: SecretView)');
    expect(tableComponent).toContain(
      'handleStatusChange(Boolean(enabled), row)',
    );
    expect(page).toContain('<CreateModal');
    expect(page).toContain('<EditModal');
    expect(page).toContain('<RotateModal');
    expect(page).toContain('<DetailDrawer />');
  });

  it('provides an explicit click target for complete purpose scope', () => {
    const tableComponent = source('./components/secret-table.vue');

    expect(tableComponent).toContain('<Popover');
    expect(tableComponent).toContain('查看全部');
  });

  it('uses the same query permission for both detail entry points', () => {
    const page = source('./index.vue');
    const tableComponent = source('./components/secret-table.vue');

    expect(page).toContain('const canQuerySecret');
    expect(tableComponent).toContain('v-if="canQuerySecret"');
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
    const tableComponent = source('./components/secret-table.vue');
    const createModal = source('./components/secret-create-modal.vue');
    const editModal = source('./components/secret-edit-modal.vue');
    const detailDrawer = source('./components/secret-detail-drawer.vue');

    expect(model).toContain('description: null | string');
    expect(tableComponent).toContain('row.description');
    expect(createModal).toContain("fieldName: 'description'");
    expect(editModal).toContain("fieldName: 'description'");
    expect(detailDrawer).toContain("label: '凭据描述'");
  });
});
