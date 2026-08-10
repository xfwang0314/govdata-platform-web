/* eslint-disable vue/one-component-per-file, vue/order-in-components */
import { createApp, h, nextTick, ref } from 'vue';

import { describe, expect, it, vi } from 'vitest';

import SecretValuesEditor from './secret-values-editor.vue';

vi.mock('antdv-next', async () => {
  const { defineComponent, h: render } = await import('vue');
  const Input = defineComponent({
    emits: ['update:value'],
    inheritAttrs: false,
    props: { value: { default: '', type: String } },
    setup(props, { attrs, emit }) {
      return () =>
        render('input', {
          ...attrs,
          onInput: (event: Event) =>
            emit('update:value', (event.target as HTMLInputElement).value),
          value: props.value,
        });
    },
  });
  Object.assign(Input, { Password: Input, TextArea: Input });
  return {
    Button: defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          render('button', slots.default?.()),
    }),
    Input,
  };
});

interface ValuesEditorExposed {
  getValues: () => Record<string, string>;
  validate: () => { message?: string; valid: boolean };
}

describe('secretValuesEditor', () => {
  it('collects a username/password credential for rotation', async () => {
    const host = document.createElement('div');
    const editor = ref<null | ValuesEditorExposed>(null);
    const app = createApp({
      setup: () => () =>
        h(SecretValuesEditor, {
          definition: {
            dynamicFieldsAllowed: false,
            fields: [
              {
                code: 'username',
                inputType: 'TEXT',
                label: '用户名',
                maxLength: 500,
                required: true,
              },
              {
                code: 'password',
                inputType: 'PASSWORD',
                label: '密码',
                maxLength: 8192,
                required: true,
              },
            ],
            label: '用户名和密码',
            value: 'USERNAME_PASSWORD',
          },
          ref: editor,
        }),
    });
    app.mount(host);
    await nextTick();

    const username = host.querySelector<HTMLInputElement>(
      'input[placeholder="请输入用户名"]',
    );
    const password = host.querySelector<HTMLInputElement>(
      'input[placeholder="请输入密码"]',
    );
    expect(username).not.toBeNull();
    expect(password).not.toBeNull();
    if (!username || !password) {
      throw new Error('用户名或密码输入框未渲染');
    }
    username.value = 'datasource_user';
    username.dispatchEvent(new Event('input', { bubbles: true }));
    password.value = 'new-password';
    password.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(editor.value?.validate()).toEqual({ valid: true });
    expect(editor.value?.getValues()).toEqual({
      password: 'new-password',
      username: 'datasource_user',
    });

    app.unmount();
  });
});
