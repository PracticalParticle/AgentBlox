import type { ReactNode } from 'react';
import { statusColor } from '../../lib/tool-parser';
import { tierLabel, userStatusLabel } from '../../lib/format';

type Tier = 'read' | 'propose' | 'execute' | 'validate';

type Props = {
  title: string;
  tier: Tier;
  status?: string;
  summary?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export default function CardShell({ title, tier, status, summary, children, footer }: Props) {
  const color = statusColor(status);
  return (
    <div className={`typed-card status-${color}`}>
      <div className="typed-card-header">
        <div className="typed-card-titles">
          <span className="typed-card-title">{title}</span>
          {summary ? <span className="typed-card-summary">{summary}</span> : null}
        </div>
        <div className="typed-card-badges">
          <span className="tier-badge">{tierLabel(tier)}</span>
          {status ? (
            <span className={`status-badge ${color}`}>{userStatusLabel(status)}</span>
          ) : null}
        </div>
      </div>
      {children ? <div className="typed-card-body">{children}</div> : null}
      {footer ? <div className="typed-card-footer">{footer}</div> : null}
    </div>
  );
}
