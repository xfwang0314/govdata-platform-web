<script setup lang="ts">
import { ref, watch } from 'vue';

import { Modal } from 'antdv-next';

import CronGenerator from './cron-generator.vue';

const props = withDefaults(
  defineProps<{
    open?: boolean;
    value?: string;
  }>(),
  {
    open: false,
    value: '0 0 2 * * ?',
  },
);

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'update:value', val: string): void;
  (e: 'ok', val: string): void;
  (e: 'cancel'): void;
}>();

const visible = ref(props.open);
const tempValue = ref(props.value);

watch(
  () => props.open,
  (val) => {
    visible.value = val;
    if (val) tempValue.value = props.value || '0 0 2 * * ?';
  },
);

watch(visible, (val) => {
  emit('update:open', val);
});

function handleOk(val: string) {
  emit('update:value', val);
  emit('ok', val);
  visible.value = false;
}

function handleCancel() {
  emit('cancel');
  visible.value = false;
}
</script>

<template>
  <Modal
    v-model:open="visible"
    title="Cron表达式生成器"
    :width="760"
    :footer="null"
    destroy-on-close
  >
    <CronGenerator
      :value="tempValue"
      class="pt-1"
      @ok="handleOk"
      @cancel="handleCancel"
    />
  </Modal>
</template>
