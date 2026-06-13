import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ChatInput from '../components/chat/ChatInput';
import ChatMessageView from '../components/chat/ChatMessageView';
import { useServerHealth } from '../hooks/useServerHealth';

export default function CopilotPage() {
  const { health } = useServerHealth();
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isBusy = status === 'streaming' || status === 'submitted';

  return (
    <section className="page copilot-page">
      <header className="copilot-header">
        <div>
          <h1>Treasury Copilot</h1>
          <p className="lead">
            Conversational interface for treasury operations. Tools are policy-gated by Bloxchain
            AccountBlox — propose, review, approve, execute.
          </p>
        </div>
        <div className="copilot-meta">
          <span className={`status-badge ${health?.llmEnabled ? 'completed' : 'pending'}`}>
            {health?.mode || 'loading'}
          </span>
          <span className={`status-badge ${health?.treasuryConfigured ? 'completed' : 'blocked'}`}>
            {health?.treasuryConfigured ? 'treasury ok' : 'treasury missing'}
          </span>
        </div>
      </header>

      <div className="chat-panel">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p>
                Try <code>/status</code> for treasury state, <code>/rebalance</code> for a treasury
                operation, or <code>/pay</code> for a timelock vendor payment.
              </p>
              {!health?.llmEnabled ? (
                <p className="chat-hint">
                  No <code>OPENAI_API_KEY</code> — slash commands and keywords work via fallback
                  router. Add a key for natural language.
                </p>
              ) : null}
            </div>
          ) : (
            messages.map((message) => <ChatMessageView key={message.id} message={message} />)
          )}
        </div>
        <ChatInput
          disabled={isBusy}
          onSend={(text) => sendMessage({ text })}
          placeholder={
            health?.llmEnabled
              ? 'Ask about balances, rebalances, payments, or policy...'
              : 'Use /status, /rebalance, /pay, /attack, or /help'
          }
        />
      </div>
    </section>
  );
}
