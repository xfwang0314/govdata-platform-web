import type { ID, PageResult } from '#/api/common';
import type {
  MetadataChangeIssueView,
  MetadataOptionsView,
  MetadataTableRevisionView,
} from '#/api/govdata/metadata/model';

import { ref } from 'vue';
interface HistoryServices {
  revisions: (
    id: ID,
    page: number,
    size: number,
  ) => PromiseLike<PageResult<MetadataTableRevisionView>>;
  issues: (
    id: ID,
    page: number,
    size: number,
  ) => PromiseLike<PageResult<MetadataChangeIssueView>>;
  options: () => PromiseLike<MetadataOptionsView>;
}
export function useMetadataHistory(services: HistoryServices) {
  const tableId = ref<ID>();
  const issues = ref<MetadataChangeIssueView[]>([]);
  const revisions = ref<MetadataTableRevisionView[]>([]);
  const revisionPage = ref(1);
  const revisionPageSize = ref(20);
  const revisionTotal = ref(0);
  const issuePage = ref(1);
  const issuePageSize = ref(20);
  const issueTotal = ref(0);
  const issueLoaded = ref(false);
  const issueLoading = ref(false);
  const revisionLoading = ref(false);
  const issueFailed = ref(false);
  const optionsFailed = ref(false);
  const revisionFailed = ref(false);
  const options = ref<MetadataOptionsView>();
  let issueVersion = 0;
  let openVersion = 0;
  let revisionVersion = 0;
  async function loadRevisions() {
    const id = tableId.value;
    if (id === undefined) return;
    const version = ++revisionVersion;
    revisionLoading.value = true;
    revisionFailed.value = false;
    try {
      const page = await services.revisions(
        id,
        revisionPage.value,
        revisionPageSize.value,
      );
      if (version !== revisionVersion) return;
      revisions.value = page.rows;
      revisionTotal.value = page.total;
    } catch {
      if (version === revisionVersion) {
        revisionFailed.value = true;
        revisions.value = [];
      }
    } finally {
      if (version === revisionVersion) revisionLoading.value = false;
    }
  }
  async function loadIssues() {
    const id = tableId.value;
    if (id === undefined) return;
    const version = ++issueVersion;
    issueLoading.value = true;
    issueFailed.value = false;
    try {
      const page = await services.issues(
        id,
        issuePage.value,
        issuePageSize.value,
      );
      if (version !== issueVersion) return;
      issues.value = page.rows;
      issueTotal.value = page.total;
      issueLoaded.value = true;
    } catch {
      if (version === issueVersion) {
        issueFailed.value = true;
        issues.value = [];
      }
    } finally {
      if (version === issueVersion) issueLoading.value = false;
    }
  }
  async function loadOptions() {
    const version = openVersion;
    optionsFailed.value = false;
    try {
      const loaded = await services.options();
      if (version === openVersion) options.value = loaded;
    } catch {
      if (version === openVersion) optionsFailed.value = true;
    }
  }
  async function open(id: ID) {
    openVersion += 1;
    revisionVersion += 1;
    issueVersion += 1;
    tableId.value = id;
    revisions.value = [];
    issues.value = [];
    revisionTotal.value = 0;
    issueTotal.value = 0;
    revisionPage.value = 1;
    issuePage.value = 1;
    issueLoaded.value = false;
    issueLoading.value = false;
    revisionFailed.value = false;
    issueFailed.value = false;
    options.value = undefined;
    await Promise.all([loadRevisions(), loadOptions()]);
  }
  return {
    revisions,
    issues,
    revisionPage,
    revisionPageSize,
    revisionTotal,
    issuePage,
    issuePageSize,
    issueTotal,
    revisionLoading,
    issueLoading,
    issueLoaded,
    revisionFailed,
    issueFailed,
    optionsFailed,
    options,
    open,
    loadRevisions,
    loadIssues,
    loadOptions,
  };
}
