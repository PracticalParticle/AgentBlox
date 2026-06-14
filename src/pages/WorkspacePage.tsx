import { useMemo, useRef, useEffect } from 'react';

import { useChat } from '@ai-sdk/react';

import { DefaultChatTransport } from 'ai';

import type { UIMessage } from 'ai';

import { Navigate } from 'react-router-dom';

import ChatInput, { type ChatInputHandle } from '../components/chat/ChatInput';

import ChatMessageView from '../components/chat/ChatMessageView';

import ActionCenter from '../components/workspace/ActionCenter';

import ActivityFeed from '../components/workspace/ActivityFeed';

import ApprovalsPanel from '../components/workspace/ApprovalsPanel';

import DemoBanner from '../components/workspace/DemoBanner';

import DemoEmptyState from '../components/workspace/DemoEmptyState';

import StatusRail from '../components/workspace/StatusRail';

import { usePendingApprovals } from '../hooks/usePendingApprovals';

import { useServerHealth } from '../hooks/useServerHealth';

import { useTreasuryStatus } from '../hooks/useTreasuryStatus';

import {

  extractActivityItems,

  extractSessionApprovals,

} from '../lib/activity';

import { DEMO_TREASURY_STATUS } from '../lib/demo-data';

import { isDemoMode } from '../lib/demo-mode';

import { parseToolBlocks } from '../lib/tool-parser';



function collectToolBlocks(messages: UIMessage[]) {

  const blocks: Array<{ tool: string; result: unknown }> = [];

  const activityEntries: Array<{ id: string; tool: string; result: unknown; timestamp: number }> =

    [];



  for (const message of messages) {

    if (message.role !== 'assistant') continue;

    const text = message.parts

      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')

      .map((part) => part.text)

      .join('\n');

    const parsed = parseToolBlocks(text);

    for (const [index, block] of parsed.entries()) {

      blocks.push(block);

      activityEntries.push({

        id: `${message.id}-${index}`,

        tool: block.tool,

        result: block.result,

        timestamp: Date.now(),

      });

    }

  }



  return { blocks, activityEntries };

}



export default function WorkspacePage() {

  const demo = isDemoMode();

  const chatInputRef = useRef<ChatInputHandle>(null);

  const { health, loading: healthLoading } = useServerHealth();

  const treasuryEnabled = (health?.treasuryConfigured ?? false) && !demo;

  const { status: liveTreasury, loading: treasuryLoading } = useTreasuryStatus(treasuryEnabled);

  const treasuryStatus = demo ? DEMO_TREASURY_STATUS : liveTreasury;

  const { data: pendingData, loading: pendingLoading, refresh: refreshPending } =

    usePendingApprovals(treasuryEnabled);



  const { messages, sendMessage, status } = useChat({

    transport: new DefaultChatTransport({ api: '/api/chat' }),

  });



  const isBusy = status === 'streaming' || status === 'submitted';



  useEffect(() => {

    function onKeyDown(event: KeyboardEvent) {

      if (event.key !== '/') return;

      const target = event.target as HTMLElement | null;

      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {

        return;

      }

      event.preventDefault();

      chatInputRef.current?.focus();

    }

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);

  }, []);



  const { blocks, activityEntries } = useMemo(

    () => collectToolBlocks(messages),

    [messages],

  );



  const sessionApprovals = useMemo(() => extractSessionApprovals(blocks), [blocks]);

  const activityItems = useMemo(() => extractActivityItems(activityEntries), [activityEntries]);



  function handleSend(text: string) {

    void sendMessage({ text });

    if (text.startsWith('/pending') || text.startsWith('/pay') || text.startsWith('/rebalance')) {

      void refreshPending();

    }

  }



  if (!demo && !healthLoading && health && !health.treasuryConfigured) {

    return <Navigate to="/setup" replace />;

  }



  return (
    <div className="workspace-shell">
      {demo ? <DemoBanner /> : null}
      <div className="workspace-page">
        <StatusRail
          health={health}
          treasury={treasuryStatus}
          treasuryLoading={treasuryLoading && !demo}
          demo={demo}
        />

        <ActionCenter>
          <div className="action-center-head">
            <h1>Treasury Workspace</h1>
            <p className="lead">
              Policy-gated operations — agent proposes, Bloxchain enforces, humans approve.
            </p>
            {isBusy ? (
              <p className="streaming-indicator" aria-live="polite">
                Copilot is thinking…
              </p>
            ) : null}
          </div>

          <div className="chat-panel workspace-chat">
            <div className="chat-messages">
              {messages.length === 0 ? (
                demo ? (
                  <DemoEmptyState onSelectCommand={handleSend} />
                ) : (
                  <div className="chat-empty">
                    <p>
                      Your treasury is connected. Try <strong>/status</strong> for balances,{' '}
                      <strong>/rebalance</strong> to propose a swap, <strong>/pay 5$</strong> for
                      instant payment, or <strong>/pay 20$</strong> for timelock.
                    </p>
                    {!health?.llmEnabled ? (
                      <p className="chat-hint">
                        Slash commands work without <code>OPENAI_API_KEY</code>. Add a key for natural
                        language.
                      </p>
                    ) : null}
                  </div>
                )
              ) : (
                messages.map((message) => <ChatMessageView key={message.id} message={message} />)
              )}
            </div>
            <ChatInput
              ref={chatInputRef}
              disabled={isBusy}
              onSend={handleSend}
              placeholder={
                health?.llmEnabled
                  ? 'Ask about balances, rebalances, payments, or policy…'
                  : 'Use /status, /rebalance, /pay 5$, /pay 20$, /attack, or /help'
              }
            />
          </div>
        </ActionCenter>

        <aside className="workspace-sidebar">
          <ApprovalsPanel
            onChain={pendingData}
            sessionApprovals={sessionApprovals}
            loading={pendingLoading && !demo}
            onSelectCommand={handleSend}
          />
          <ActivityFeed items={activityItems} />
        </aside>
      </div>
    </div>
  );
}

