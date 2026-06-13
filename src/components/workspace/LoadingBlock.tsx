type Props = {
  label?: string;
};

export default function LoadingBlock({ label = 'Loading…' }: Props) {
  return (
    <div className="loading-block" aria-busy="true">
      <span className="loading-pulse" />
      <span className="card-copy muted">{label}</span>
    </div>
  );
}
