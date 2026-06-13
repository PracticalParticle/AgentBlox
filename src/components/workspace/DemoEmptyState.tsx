import { DEMO_SAMPLE_COMMANDS } from '../../lib/demo-data';

type Props = {
  onSelectCommand: (command: string) => void;
};

export default function DemoEmptyState({ onSelectCommand }: Props) {
  return (
    <div className="chat-empty demo-empty">
      <p>
        <strong>Judge demo</strong> — sample treasury in the left rail. Try slash commands below
        (requires server <code>.env</code> for live on-chain reads).
      </p>
      <div className="demo-command-grid">
        {DEMO_SAMPLE_COMMANDS.map((item) => (
          <button
            key={item.command}
            type="button"
            className="suggestion-chip"
            onClick={() => onSelectCommand(item.command)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
