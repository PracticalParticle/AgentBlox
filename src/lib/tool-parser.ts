export type AgentBloxToolPayload = {
  tool: string;
  result: unknown;
};

const TOOL_BLOCK_REGEX = /```agentblox-tool\n([\s\S]*?)```/g;

export function parseToolBlocks(content: string): AgentBloxToolPayload[] {
  const results: AgentBloxToolPayload[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(TOOL_BLOCK_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    try {
      results.push(JSON.parse(match[1]) as AgentBloxToolPayload);
    } catch {
      // ignore malformed blocks
    }
  }
  return results;
}

export function stripToolBlocks(content: string): string {
  return content.replace(TOOL_BLOCK_REGEX, '').trim();
}

export function statusColor(status: string | undefined): string {
  switch (status) {
    case 'proposed':
    case 'requested':
    case 'requested_on_chain':
    case 'requested_unsigned':
    case 'proposed_unsigned':
    case 'preview':
      return 'pending';
    case 'blocked':
    case 'rejected':
      return 'blocked';
    case 'ok':
    default:
      return 'completed';
  }
}
