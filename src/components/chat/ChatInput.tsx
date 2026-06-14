import { FormEvent, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CHAT_SLASH_SUGGESTIONS } from '../../lib/slash-commands';

export type ChatInputHandle = {
  focus: () => void;
};

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const SUGGESTIONS = [...CHAT_SLASH_SUGGESTIONS];

const ChatInput = forwardRef<ChatInputHandle, Props>(function ChatInput(
  { onSend, disabled, placeholder },
  ref,
) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

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
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || 'Ask about your treasury or use /help'}
          disabled={disabled}
          aria-label="Chat message"
        />
        <button type="submit" className="primary" disabled={disabled || !input.trim()}>
          Send
        </button>
      </form>
      <p className="chat-input-hint muted">Press <kbd>/</kbd> to focus · slash commands always work</p>
    </div>
  );
});

export default ChatInput;
