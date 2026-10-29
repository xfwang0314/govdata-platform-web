import type { ID } from '#/api/common';

export interface OptionView {
  label: string;
  value: string;
}

export interface MetadataColumnView {
  assetCode: string;
  assetId: ID;
  commentText: null | string;
  dataType: null | string;
  defaultExpression: null | string;
  displayName: null | string;
  lengthValue: null | number;
  nullableFlag: boolean | null;
  ordinalPosition: null | number;
  originalName: string;
  precisionValue: null | number;
  primaryKeyFlag: boolean | null;
  revisionNo: number;
  scaleValue: null | number;
  technicalStatus: string;
}

export interface MetadataAssetView {
  assetCode: string;
  assetId: ID;
  assetType: string;
  authzResourceId: ID | null;
  businessName: null | string;
  canonicalKey: string;
  classificationCode: string;
  columns: MetadataColumnView[];
  commentText: null | string;
  contentHash: string;
  currentRevisionNo: null | number;
  datasourceId: ID;
  description: null | string;
  displayName: null | string;
  firstSeenTime: string;
  governanceStatus: string;
  lastHarvestRunId: ID;
  lastSeenTime: string;
  lockVersion: number;
  nativeObjectId: null | string;
  originalName: string;
  ownerDeptId: ID;
  parentAssetId: ID | null;
  securityLevel: number;
  stewardUserId: ID | null;
  structureHash: string;
  tableType: null | string;
  technicalStatus: string;
}

export interface MetadataAssetTreeView {
  assetCode: string;
  assetId: ID;
  assetType: string;
  children: MetadataAssetTreeView[];
  displayName: null | string;
  governanceStatus: string;
  originalName: string;
  parentAssetId: ID | null;
  technicalStatus: string;
}

export interface MetadataRevisionColumnView {
  columnAssetId: ID;
  columnRevisionNo: number;
  commentText: null | string;
  dataType: string;
  defaultExpression: null | string;
  lengthValue: null | number;
  nativeType: string;
  nullableFlag: boolean;
  ordinalPosition: number;
  originalName: string;
  precisionValue: null | number;
  primaryKeyFlag: boolean;
  scaleValue: null | number;
}

export interface MetadataTableRevisionView {
  actorId: string;
  actorType: string;
  changeLevel: string;
  changeSummaryJson: string;
  columns: MetadataRevisionColumnView[];
  contentHash: string;
  harvestRunId: ID;
  observedTime: string;
  previousRevisionNo: null | number;
  revisionNo: number;
  structureHash: string;
  tableAssetId: ID;
  tableRevisionId: ID;
  traceId: null | string;
}

export interface MetadataChangeIssueView {
  assigneeId: null | string;
  assigneeType: null | string;
  changeIssueId: ID;
  changeLevel: string;
  changeSummaryJson: string;
  detectedTime: string;
  fromRevisionNo: null | number;
  issueCode: string;
  issueType: string;
  issueStatus: string;
  resolvedTime: null | string;
  tableAssetId: ID;
  toRevisionNo: number;
  traceId: null | string;
}

export interface MetadataOptionsView {
  assetTypes: OptionView[];
  changeIssueStatuses: OptionView[];
  changeIssueTypes: OptionView[];
  changeLevels: OptionView[];
  classifications: OptionView[];
  governanceStatuses: OptionView[];
  securityLevels: OptionView[];
  technicalStatuses: OptionView[];
}

export interface MetadataGovernanceCommand {
  businessName: null | string;
  classificationCode: string;
  description: null | string;
  displayName: null | string;
  governanceStatus: string;
  lockVersion: number;
  securityLevel: number;
  stewardUserId: ID | null;
}

export interface MetadataImpactView {
  assetId: ID;
  consumerCode: null | string;
  consumerId: string;
  consumerName: string;
  consumerStatus: string;
  consumerType: string;
  dependencyType: string;
  impactProjectionId: ID;
  sourceModule: string;
  sourceUpdatedTime: null | string;
  tableAssetId: ID;
}
