export function useAgentConfigs() {
  function getStreamableHttpEndpoint(): string {
    const origin = window.location.origin;
    return `${origin}/platform/mcp`;
  }

  function generateStandardMcpConfig(
    token = '<YOUR_AGENT_TOKEN>',
    customUrl?: string,
  ): string {
    const url = customUrl || getStreamableHttpEndpoint();
    return JSON.stringify(
      {
        mcpServers: {
          'govdata-platform': {
            url,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        },
      },
      null,
      2,
    );
  }

  return {
    generateStandardMcpConfig,
    getStreamableHttpEndpoint,
  };
}
