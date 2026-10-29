<script setup lang="ts">
withDefaults(
  defineProps<{
    detail?: string;
    label: string;
    tone?: 'danger' | 'default' | 'info' | 'success' | 'warning';
  }>(),
  { detail: undefined, tone: 'default' },
);
</script>

<template>
  <span class="gov-console-status" :data-tone="tone">
    <span class="gov-console-status__dot" aria-hidden="true"></span>
    <span class="min-w-0">
      <span class="block truncate font-medium text-foreground/85">
        {{ label }}
      </span>
      <span v-if="detail" class="block truncate text-xs" :title="detail">
        {{ detail }}
      </span>
    </span>
  </span>
</template>
