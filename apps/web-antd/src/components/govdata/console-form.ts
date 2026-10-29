import type { VbenFormProps, VbenFormSchema } from '#/adapter/form';

/** 新建/编辑表单的共同规格；查询表单不使用此配置。 */
export const consoleFormLayout = {
  labelWidth: 96,
  gridClass: 'grid grid-cols-1 gap-x-4 md:grid-cols-2',
  modalWidth: 920,
  nativeProps: {
    colon: false,
    labelAlign: 'right' as const,
    labelCol: { flex: '96px' },
    wrapperCol: { flex: '1 1 0' },
    layout: 'horizontal' as const,
  },
};

export function consoleFormConfig(): Partial<VbenFormProps> {
  return {
    commonConfig: {
      componentProps: { class: 'w-full' },
      labelWidth: consoleFormLayout.labelWidth,
    },
    layout: 'horizontal',
    showDefaultActions: false,
    wrapperClass: consoleFormLayout.gridClass,
  };
}

export function consoleFormSection(
  fieldName: string,
  text: string,
): VbenFormSchema {
  return {
    component: 'Divider',
    componentProps: {
      class: 'gov-form-section-divider',
      titlePlacement: 'start',
      plain: true,
    },
    fieldName,
    formItemClass: 'col-span-full',
    hideLabel: true,
    renderComponentContent: () => ({ default: () => text }),
  };
}
