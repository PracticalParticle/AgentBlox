export type ActivityItem = {
  id: string;
  label: string;
  tool: string;
  timestamp: number;
};

type Props = {
  items: ActivityItem[];
};

export default function ActivityFeed({ items }: Props) {
  return (
    <section className="activity-feed">
      <h2>Activity</h2>
      {items.length === 0 ? (
        <p className="card-copy muted">Actions from this session appear here.</p>
      ) : (
        <ul className="activity-list">
          {items.map((item) => (
            <li key={item.id}>
              <time>{new Date(item.timestamp).toLocaleTimeString()}</time>
              <span>{item.label}</span>
              <span className="mono muted">{item.tool}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
