<script setup lang="ts">
import type { SecretType } from '#/api/platform/secret/model';

import { ref, watch } from 'vue';

import { Button, Input } from 'antdv-next';

const props = defineProps<{ secretType?: SecretType }>();

const InputPassword = Input.Password;

interface KeyValueRow {
  id: number;
  key: string;
  value: string;
}

interface ValidationResult {
  message?: string;
  valid: boolean;
}

const username = ref('');
const password = ref('');
const token = ref('');
const nextRowId = ref(2);
const keyValueRows = ref<KeyValueRow[]>([{ id: 1, key: '', value: '' }]);

watch(
  () => props.secretType,
  () => reset(),
);

function addRow() {
  keyValueRows.value.push({ id: nextRowId.value++, key: '', value: '' });
}

function removeRow(id: number) {
  if (keyValueRows.value.length === 1) {
    keyValueRows.value = [{ id: nextRowId.value++, key: '', value: '' }];
    return;
  }
  keyValueRows.value = keyValueRows.value.filter((row) => row.id !== id);
}

function reset() {
  username.value = '';
  password.value = '';
  token.value = '';
  keyValueRows.value = [{ id: nextRowId.value++, key: '', value: '' }];
}

function validate(): ValidationResult {
  if (!props.secretType) {
    return { message: '请先选择凭据类型', valid: false };
  }
  if (props.secretType === 'USERNAME_PASSWORD') {
    if (!username.value.trim() || !password.value) {
      return { message: '用户名和密码均不能为空', valid: false };
    }
    return { valid: true };
  }
  if (props.secretType === 'PASSWORD' && !password.value) {
    return { message: '密码不能为空', valid: false };
  }
  if (props.secretType === 'TOKEN' && !token.value) {
    return { message: '令牌不能为空', valid: false };
  }
  if (props.secretType === 'KEY_VALUE') {
    if (keyValueRows.value.some((row) => !row.key.trim() || !row.value)) {
      return { message: '键名和值均不能为空', valid: false };
    }
    const keys = keyValueRows.value.map((row) => row.key.trim());
    if (keys.some((key) => !/^[a-z][a-zA-Z0-9_]{0,63}$/.test(key))) {
      return {
        message: '键名须以小写字母开头，只能包含字母、数字和下划线',
        valid: false,
      };
    }
    if (new Set(keys).size !== keys.length) {
      return { message: '键名不能重复', valid: false };
    }
  }
  return { valid: true };
}

function getValues(): Record<string, string> {
  switch (props.secretType) {
    case 'KEY_VALUE': {
      return Object.fromEntries(
        keyValueRows.value.map((row) => [row.key.trim(), row.value]),
      );
    }
    case 'PASSWORD': {
      return { password: password.value };
    }
    case 'TOKEN': {
      return { token: token.value };
    }
    case 'USERNAME_PASSWORD': {
      return { password: password.value, username: username.value.trim() };
    }
    default: {
      return {};
    }
  }
}

defineExpose({ getValues, reset, validate });
</script>

<template>
  <div class="secret-values">
    <div v-if="!secretType" class="secret-values__empty">
      <span class="iconify mdi--key-variant text-2xl"></span>
      <span>选择凭据类型后填写敏感值</span>
    </div>

    <div
      v-else-if="secretType === 'USERNAME_PASSWORD'"
      class="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <div>
        <div class="mb-1.5 text-sm font-medium">用户名</div>
        <Input
          v-model:value="username"
          autocomplete="off"
          placeholder="请输入用户名"
        />
      </div>
      <div>
        <div class="mb-1.5 text-sm font-medium">密码</div>
        <InputPassword
          v-model:value="password"
          autocomplete="new-password"
          placeholder="请输入密码"
        />
      </div>
    </div>

    <div v-else-if="secretType === 'PASSWORD'">
      <div class="mb-1.5 text-sm font-medium">密码</div>
      <InputPassword
        v-model:value="password"
        autocomplete="new-password"
        placeholder="请输入密码"
      />
    </div>

    <div v-else-if="secretType === 'TOKEN'">
      <div class="mb-1.5 text-sm font-medium">令牌</div>
      <InputPassword
        v-model:value="token"
        autocomplete="new-password"
        placeholder="请输入 Token"
      />
    </div>

    <div v-else>
      <div class="secret-kv-toolbar">
        <div>
          <div class="text-sm font-medium">键值项</div>
          <div class="mt-0.5 text-xs text-slate-400">
            每项由唯一键名和一个敏感值组成
          </div>
        </div>
        <Button
          :disabled="keyValueRows.length >= 16"
          size="small"
          @click="addRow"
        >
          添加一项
        </Button>
      </div>
      <div class="secret-kv-list">
        <div v-for="row in keyValueRows" :key="row.id" class="secret-kv-row">
          <Input
            v-model:value="row.key"
            autocomplete="off"
            placeholder="键名，如 accessKey"
          />
          <InputPassword
            v-model:value="row.value"
            autocomplete="new-password"
            placeholder="敏感值"
          />
          <Button danger size="small" @click="removeRow(row.id)">
            <span class="iconify mdi--trash-can-outline"></span>
            删除
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.secret-values {
  min-height: 86px;
  padding: 16px;
  background: hsl(var(--muted) / 25%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.secret-values__empty {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  color: hsl(var(--muted-foreground));
}

.secret-kv-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.secret-kv-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-x: auto;
}

.secret-kv-row {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(280px, 1.4fr) 76px;
  gap: 10px;
  align-items: center;
  min-width: 590px;
}

.secret-kv-row :deep(.ant-btn) {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  width: 76px;
}
</style>
