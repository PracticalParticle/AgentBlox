import type { AgentBloxToolPayload } from '../../lib/tool-parser';
import { statusColor } from '../../lib/tool-parser';

type Props = {
  payload: AgentBloxToolPayload;
};

export default function ToolResultCard({ payload }: Props) {
  const result = payload.result as Record<string, unknown> | null;
  const status =
    typeof result?.status === 'string'
      ? result.status
      : typeof result?.configured === 'boolean' && !result.configured
        ? 'rejected'
        : 'ok';

  return (
    <div className={`tool-card status-${statusColor(status)}`}>
      <div className="tool-card-header">
        <span className="tool-name">{payload.tool}</span>
        <span className={`status-badge ${statusColor(status)}`}>{status}</span>
      </div>
      <pre className="tool-card-body">{JSON.stringify(payload.result, null, 2)}</pre>
    </div>
  );
}
