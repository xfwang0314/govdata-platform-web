import type { ID } from '#/api/common';

export interface OptionView {
  label: string;
  value: string;
}

export interface HarvestRuleCommand {
  matchType: string;
  rulePattern: string;
  ruleScope: string;
  ruleType: string;
  sortNo: number;
}

export interface HarvestPlanCommand {
  catalogName?: string;
  cronExpression?: string;
  datasourceId: ID;
  harvestPlanName: string;
  lockVersion?: number;
  maxTableCount?: null | number;
  ownerDeptId: ID;
  planStatus: string;
  rawArchiveFlag: boolean;
  rules: HarvestRuleCommand[];
  scheduleType: string;
  schemaName?: string;
}

export interface HarvestRuleView extends HarvestRuleCommand {
  harvestRuleId: ID;
}

export interface HarvestPlanView {
  catalogName: null | string;
  createTime: string;
  cronExpression: null | string;
  currentPlanRevisionNo: number;
  datasourceId: ID;
  datasourceResourceId: ID;
  harvestPlanCode: string;
  harvestPlanId: ID;
  harvestPlanName: string;
  lockVersion: number;
  maxTableCount: number;
  ownerDeptId: ID;
  planStatus: string;
  rawArchiveFlag: boolean;
  rules: HarvestRuleView[];
  scheduleType: string;
  schemaName: null | string;
  updateTime: string;
}

export interface HarvestRunFailureView {
  attemptNo: number;
  failureCode: string;
  failureScope: string;
  failureSummary: string;
  objectKey: null | string;
  occurredTime: string;
  runFailureId: ID;
}

export interface HarvestRunView {
  activeTableCount: number;
  actorId: string;
  actorType: string;
  changedTableCount: number;
  completeRunFlag: boolean;
  completedTime: null | string;
  datasourceId: ID;
  discoveredTableCount: number;
  failedTableCount: number;
  failureCode: null | string;
  failureSummary: null | string;
  failures: HarvestRunFailureView[];
  harvestPlanId: ID;
  harvestRunId: ID;
  harvestRunNo: string;
  missingCandidateCount: number;
  missingMarkedCount: number;
  missingSuppressedFlag: boolean;
  planRevisionId: ID;
  runStatus: string;
  startedTime: string;
  traceId: null | string;
  triggerType: string;
}

export interface HarvestOptionsView {
  matchTypes: OptionView[];
  planStatuses: OptionView[];
  ruleScopes: OptionView[];
  ruleTypes: OptionView[];
  runStatuses: OptionView[];
  scheduleTypes: OptionView[];
}
