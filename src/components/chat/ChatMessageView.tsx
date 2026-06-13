import type { UIMessage } from 'ai';
import ToolResultCard from './ToolResultCard';
import { parseToolBlocks, stripToolBlocks } from '../../lib/tool-parser';

type Props = {
  message: UIMessage;
};

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
}

export default function ChatMessageView({ message }: Props) {
  const text = getTextContent(message);
  const toolBlocks = parseToolBlocks(text);
  const plainText = stripToolBlocks(text);

  return (
    <div className={`chat-message role-${message.role}`}>
      <div className="chat-message-label">{message.role === 'user' ? 'You' : 'Copilot'}</div>
      {plainText ? <div className="chat-message-text">{plainText}</div> : null}
      {toolBlocks.map((block, index) => (
        <ToolResultCard key={`${message.id}-${index}`} payload={block} />
      ))}
      {message.parts
        .filter((part) => part.type.startsWith('tool-'))
        .map((part, index) => (
          <div key={`${message.id}-tool-${index}`} className="tool-card">
            <div className="tool-card-header">
              <span className="tool-name">{part.type}</span>
            </div>
            <pre className="tool-card-body">{JSON.stringify(part, null, 2)}</pre>
          </div>
        ))}
    </div>
  );
}
