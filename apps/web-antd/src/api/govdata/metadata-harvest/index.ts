import type {
  HarvestOptionsView,
  HarvestPlanCommand,
  HarvestPlanView,
  HarvestRunView,
} from './model';

import type { ID, PageQuery, PageResult } from '#/api/common';

import { alovaInstance } from '#/utils/http';

const BASE_URL = '/govdata/metadata-harvest';

export function getHarvestPlanPageApi(params: PageQuery) {
  return alovaInstance.get<PageResult<HarvestPlanView>>(`${BASE_URL}/plans`, {
    params,
  });
}
export function getHarvestPlanApi(id: ID) {
  return alovaInstance.get<HarvestPlanView>(`${BASE_URL}/plans/${id}`);
}
export function createHarvestPlanApi(data: HarvestPlanCommand) {
  return alovaInstance.post<HarvestPlanView>(`${BASE_URL}/plans`, data);
}
export function updateHarvestPlanApi(id: ID, data: HarvestPlanCommand) {
  return alovaInstance.put<HarvestPlanView>(`${BASE_URL}/plans/${id}`, data);
}
export function deleteHarvestPlanApi(id: ID) {
  return alovaInstance.delete<void>(`${BASE_URL}/plans/${id}`);
}
export function executeHarvestPlanApi(id: ID) {
  return alovaInstance.post<HarvestRunView>(
    `${BASE_URL}/plans/${id}/execute`,
    undefined,
  );
}
export function getHarvestRunPageApi(planId: ID, params: PageQuery) {
  return alovaInstance.get<PageResult<HarvestRunView>>(
    `${BASE_URL}/plans/${planId}/runs`,
    {
      params,
    },
  );
}
export function getHarvestRunApi(id: ID) {
  return alovaInstance.get<HarvestRunView>(`${BASE_URL}/runs/${id}`);
}
export function retryHarvestRunApi(id: ID) {
  return alovaInstance.post<HarvestRunView>(
    `${BASE_URL}/runs/${id}/retry`,
    undefined,
  );
}
export function getHarvestOptionsApi() {
  return alovaInstance.get<HarvestOptionsView>(`${BASE_URL}/options`);
}
