<script setup lang="ts">
import { ref, watch } from 'vue';

import { useMediaQuery } from '@vueuse/core';
import { Drawer, Splitter, SplitterPanel } from 'antdv-next';
const collapsed = defineModel<boolean>('collapsed', { default: false });
const previewOpen = defineModel<boolean>('previewOpen', { default: false });
const narrow = useMediaQuery('(max-width: 767px)');
const inlinePreview = useMediaQuery('(min-width: 1280px)');
const sidebarSize = ref(260);
const previewSize = ref(340);
watch(narrow, (value) => {
  sidebarSize.value = value ? 220 : 260;
});
function resize(sizes: number[]) {
  const size = sizes[0] ?? 0;
  if (size > 0) sidebarSize.value = size;
  collapsed.value = size === 0;
  if (inlinePreview.value) {
    const preview = sizes[2] ?? 0;
    if (preview > 0) previewSize.value = preview;
    previewOpen.value = preview > 0;
  }
}
</script>
<template>
  <div class="metadata-explorer-frame">
    <Splitter
      :key="`${narrow}:${inlinePreview}`"
      :orientation="narrow ? 'vertical' : 'horizontal'"
      class="metadata-explorer-layout"
      @resize="resize"
      @collapse="(_collapsed, sizes) => resize(sizes)"
    >
      <SplitterPanel
        :size="collapsed ? 0 : sidebarSize"
        :min="narrow ? 160 : 200"
        :max="narrow ? '45%' : '35%'"
        :destroy-on-hidden="false"
        collapsible
      >
        <slot name="navigator"></slot>
      </SplitterPanel>
      <SplitterPanel :min="narrow ? 260 : 320">
        <section class="metadata-explorer-layout__content">
          <slot></slot>
        </section>
      </SplitterPanel>
      <SplitterPanel
        v-if="inlinePreview"
        :size="previewOpen ? previewSize : 0"
        :min="280"
        max="45%"
        :destroy-on-hidden="false"
        collapsible
      >
        <slot name="preview"></slot>
      </SplitterPanel>
    </Splitter>
    <Drawer
      v-if="!inlinePreview"
      v-model:open="previewOpen"
      title="资产预览"
      :size="420"
      :styles="{ body: { padding: 0 } }"
    >
      <slot v-if="previewOpen" name="preview"></slot>
    </Drawer>
  </div>
</template>

<style scoped>
.metadata-explorer-frame {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.metadata-explorer-layout {
  height: 100%;
  min-height: 0;
}

.metadata-explorer-layout :deep(.ant-splitter-panel) {
  overflow: hidden;
}

.metadata-explorer-layout__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: hsl(var(--card));
}
</style>
