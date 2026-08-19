<script setup lang="ts">
import type { DecisionSimulationParams } from './components/decision-form.vue';
import type { DecisionItemResult } from './components/decision-result.vue';

import type {
  AuthzOptionsView,
  ResourceTreeNode,
} from '#/api/platform/auth/model';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  evaluateAuthorizationApi,
  getAuthzOptionsApi,
  getResourceTreeApi,
} from '#/api/platform/auth';

import DecisionForm from './components/decision-form.vue';
import DecisionResult from './components/decision-result.vue';

const options = ref<AuthzOptionsView | null>(null);
const evaluating = ref(false);
const results = ref<DecisionItemResult[]>([]);

function flattenResourceMap(
  nodes: ResourceTreeNode[],
  map: Map<number | string, ResourceTreeNode>,
) {
  for (const node of nodes) {
    map.set(node.id, node);
    if (node.children && node.children.length > 0) {
      flattenResourceMap(node.children, map);
    }
  }
}

async function handleEvaluate(params: DecisionSimulationParams) {
  evaluating.value = true;
  results.value = [];
  try {
    if (!options.value) {
      options.value = await getAuthzOptionsApi();
    }

    // 加载资源实体树，以便映射名称标签
    const treeNodes = await getResourceTreeApi(params.resourceType, 'ACTIVE');
    const resourceMap = new Map<number | string, ResourceTreeNode>();
    flattenResourceMap(treeNodes, resourceMap);

    const typeDef = options.value?.resourceTypes.find(
      (item) => item.typeCode === params.resourceType,
    );
    const actionLabelMap = new Map<string, string>();
    for (const act of typeDef?.actions || []) {
      actionLabelMap.set(act.value, act.label);
    }
    const purposeLabelMap = new Map<string, string>();
    for (const pur of typeDef?.purposes || []) {
      purposeLabelMap.set(pur.value, pur.label);
    }

    const tasks: Array<() => Promise<DecisionItemResult>> = [];

    for (const resId of params.resourceIds) {
      const resObj = resourceMap.get(resId);
      const resourceLabel = resObj
        ? `${resObj.label}（${resObj.code}）`
        : `资源 #${resId}`;

      for (const action of params.actions) {
        const actionLabel = actionLabelMap.get(action) || action;

        for (const purpose of params.purposes) {
          const purposeLabel = purposeLabelMap.get(purpose) || purpose;
          const key = `${resId}_${action}_${purpose}`;

          tasks.push(async () => {
            try {
              const decision = await evaluateAuthorizationApi({
                action,
                purpose,
                resourceId: resId,
                resourceType: params.resourceType,
                subjectId: params.subjectId,
                subjectType: params.subjectType,
              });
              return {
                action,
                actionLabel,
                decision,
                key,
                purpose,
                purposeLabel,
                resourceId: resId,
                resourceLabel,
              };
            } catch (error: any) {
              return {
                action,
                actionLabel,
                error: error?.message || '决策评估异常',
                key,
                purpose,
                purposeLabel,
                resourceId: resId,
                resourceLabel,
              };
            }
          });
        }
      }
    }

    // 并发执行所有验证任务
    results.value = await Promise.all(tasks.map((task) => task()));
  } finally {
    evaluating.value = false;
  }
}

function handleReset() {
  results.value = [];
}

onMounted(async () => {
  options.value = await getAuthzOptionsApi();
});
</script>

<template>
  <Page :auto-content-height="true">
    <div class="mx-auto max-w-7xl space-y-4">
      <DecisionForm
        :loading="evaluating"
        @evaluate="handleEvaluate"
        @reset="handleReset"
      />

      <DecisionResult :results="results" />
    </div>
  </Page>
</template>
