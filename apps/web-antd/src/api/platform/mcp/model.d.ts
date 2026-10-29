import type { ID } from '#/api/common';

export interface McpToolSummaryItem {
  description?: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  name: string;
  riskLevel?: 'HIGH' | 'LOW' | 'MEDIUM';
}

export interface McpCategoryOptionItem {
  code: string;
  label: string;
  tools?: McpToolSummaryItem[];
  value: string;
}

export interface McpOptionItem {
  label: string;
  value: string;
}

export interface McpOptionsView {
  categories: McpCategoryOptionItem[];
  primaryTransport: 'STREAMABLE_HTTP';
  statuses: McpOptionItem[];
}

export interface AgentTokenView {
  agentCode: string;
  agentName: string;
  allowedCategories: string[];
  createTime: string;
  deptId: ID;
  deptName?: string;
  expireTime?: string;
  lastUsedTime?: string;
  lastRotatedTime?: string;
  maxDailyRequests: number;
  remark?: string;
  status: 'ACTIVE' | 'DISABLED' | 'REVOKED';
  tokenId: ID;
  tokenPrefix: string;
  rotationCount: number;
  usedRequestsToday: number;
  userId: ID;
  userName?: string;
}

export interface AgentTokenIssuedView {
  clientConfigJson: string;
  plainToken: string;
  streamableHttpUrl: string;
  token: AgentTokenView;
}

export interface AgentTokenCreateCommand {
  agentName: string;
  allowedCategories: string[];
  expireTime?: string;
  maxDailyRequests?: number;
  remark?: string;
}

export type AgentTokenUpdateCommand = AgentTokenCreateCommand;

export interface AgentTokenQueryParam {
  agentName?: string;
  pageNum?: number;
  pageSize?: number;
  status?: string;
  userId?: ID;
}
