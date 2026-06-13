import { Link } from 'react-router-dom';

export default function DemoBanner() {
  return (
    <div className="demo-banner" role="status">
      <strong>Demo mode</strong> — read-only preview for judges. Slash commands use your server{' '}
      <code>.env</code> when configured; execution buttons require live keys.{' '}
      <Link to="/setup">Setup guide</Link>
    </div>
  );
}
