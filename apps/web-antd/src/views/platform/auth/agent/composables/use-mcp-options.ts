import type { McpOptionsView } from '#/api/platform/mcp/model';

import { readonly, ref } from 'vue';

import { getMcpOptionsApi } from '#/api/platform/mcp';

const options = ref<McpOptionsView | null>(null);
const loading = ref(false);
let fetchPromise: null | Promise<McpOptionsView> = null;

async function ensureLoaded(): Promise<McpOptionsView> {
  if (options.value) {
    return options.value;
  }
  if (fetchPromise) {
    return fetchPromise;
  }
  loading.value = true;
  fetchPromise = getMcpOptionsApi()
    .then((res) => {
      options.value = res;
      return res;
    })
    .finally(() => {
      loading.value = false;
      fetchPromise = null;
    });
  return fetchPromise;
}

async function refresh(): Promise<McpOptionsView> {
  options.value = null;
  fetchPromise = null;
  return ensureLoaded();
}

function invalidate() {
  options.value = null;
  fetchPromise = null;
}

export function useMcpOptions() {
  return {
    ensureLoaded,
    invalidate,
    loading: readonly(loading),
    options: readonly(options),
    refresh,
  };
}
