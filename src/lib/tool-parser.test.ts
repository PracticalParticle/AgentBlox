import { describe, expect, it } from 'vitest';
import { parseToolBlocks, statusColor, stripToolBlocks } from './tool-parser';

describe('parseToolBlocks', () => {
  it('parses agentblox-tool fenced JSON blocks', () => {
    const content = `Here is the result:

\`\`\`agentblox-tool
{"tool":"get_treasury_status","result":{"configured":true}}
\`\`\``;

    const blocks = parseToolBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].tool).toBe('get_treasury_status');
    expect(blocks[0].result).toEqual({ configured: true });
  });

  it('ignores malformed blocks', () => {
    const content = '```agentblox-tool\n{not-json}\n```';
    expect(parseToolBlocks(content)).toHaveLength(0);
  });
});

describe('stripToolBlocks', () => {
  it('removes tool blocks and trims surrounding text', () => {
    const content = `Summary

\`\`\`agentblox-tool
{"tool":"x","result":{}}
\`\`\``;

    expect(stripToolBlocks(content)).toBe('Summary');
  });
});

describe('statusColor', () => {
  it('maps tool statuses to UI color tokens', () => {
    expect(statusColor('proposed')).toBe('pending');
    expect(statusColor('blocked')).toBe('blocked');
    expect(statusColor('ok')).toBe('completed');
    expect(statusColor(undefined)).toBe('completed');
  });
});
