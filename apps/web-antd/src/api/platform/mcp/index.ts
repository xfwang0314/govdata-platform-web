import type {
  AgentTokenCreateCommand,
  AgentTokenIssuedView,
  AgentTokenQueryParam,
  AgentTokenUpdateCommand,
  AgentTokenView,
  McpOptionsView,
} from './model';

import type { ID, PageResult } from '#/api/common';

import { alovaInstance } from '#/utils/http';

// ── MCP 网关字典选项 ──

export function getMcpOptionsApi() {
  return alovaInstance.get<McpOptionsView>('/platform/mcp/options');
}

// ── Agent 访问凭据统一管理 API ──

export function getAgentTokenPageApi(params?: AgentTokenQueryParam) {
  return alovaInstance.get<PageResult<AgentTokenView>>(
    '/platform/mcp/tokens/page',
    { params },
  );
}

export function createAgentTokenApi(data: AgentTokenCreateCommand) {
  return alovaInstance.post<AgentTokenIssuedView>('/platform/mcp/tokens', data);
}

export function updateAgentTokenApi(
  tokenId: ID,
  data: AgentTokenUpdateCommand,
) {
  return alovaInstance.put<void>(`/platform/mcp/tokens/${tokenId}`, data);
}

export function rotateAgentTokenApi(tokenId: ID) {
  return alovaInstance.post<AgentTokenIssuedView>(
    `/platform/mcp/tokens/${tokenId}/rotate`,
  );
}

export function disableAgentTokenApi(tokenId: ID) {
  return alovaInstance.put<void>(`/platform/mcp/tokens/${tokenId}/disable`);
}

export function enableAgentTokenApi(tokenId: ID) {
  return alovaInstance.put<void>(`/platform/mcp/tokens/${tokenId}/enable`);
}

export function revokeAgentTokenApi(tokenId: ID) {
  return alovaInstance.put<void>(`/platform/mcp/tokens/${tokenId}/revoke`);
}

export function deleteAgentTokenApi(tokenId: ID) {
  return alovaInstance.delete<void>(`/platform/mcp/tokens/${tokenId}`);
}
