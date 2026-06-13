import { FormEvent, useState } from 'react';

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const SUGGESTIONS = [
  '/status',
  '/rebalance',
  '/attack',
  '/pay',
  '/ens',
  '/help',
];

export default function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [input, setInput] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  }

  return (
    <div className="chat-input-area">
      <div className="chat-suggestions">
        {SUGGESTIONS.map((cmd) => (
          <button
            key={cmd}
            type="button"
            className="suggestion-chip"
            disabled={disabled}
            onClick={() => onSend(cmd)}
          >
            {cmd}
          </button>
        ))}
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || 'Ask about your treasury or use /help'}
          disabled={disabled}
        />
        <button type="submit" className="primary" disabled={disabled || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
