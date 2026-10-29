import { describe, expect, it } from 'vitest';

import { useAgentConfigs } from './use-agent-configs';

describe('useAgentConfigs', () => {
  it('默认生成统一的 Streamable HTTP 配置', () => {
    const configs = useAgentConfigs();
    const generated = JSON.parse(
      configs.generateStandardMcpConfig('test-token'),
    );

    expect(generated.mcpServers['govdata-platform']).toEqual(
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
        url: `${window.location.origin}/platform/mcp`,
      }),
    );
  });
});
