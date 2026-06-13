import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { isLlmEnabled, LLM_MODEL } from '../config.js';
import { treasuryTools } from '../tools/index.js';
import {
  executeRoutedTool,
  formatToolResult,
  HELP_MESSAGE,
  routeUserMessage,
} from './fallback-router.js';
import { COPILOT_SYSTEM_PROMPT } from './system-prompt.js';

function getLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== 'user') continue;
    const textParts = message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text);
    return textParts.join('\n').trim();
  }
  return '';
}

async function handleFallbackChat(messages: UIMessage[]) {
  const userText = getLastUserText(messages);

  if (userText.toLowerCase().startsWith('/help') || userText.toLowerCase() === 'help') {
    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        execute: ({ writer }) => {
          writer.write({ type: 'text-start', id: 'help' });
          writer.write({ type: 'text-delta', id: 'help', delta: HELP_MESSAGE });
          writer.write({ type: 'text-end', id: 'help' });
        },
      }),
    });
  }

  const routed = routeUserMessage(userText);
  const responseText = routed
    ? formatToolResult(routed.tool, await executeRoutedTool(routed))
    : `${HELP_MESSAGE}\n\n_I could not map that message to a treasury tool. Try \`/help\` or configure OPENAI_API_KEY for natural language._`;

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: 'text-start', id: 'fallback' });
        writer.write({ type: 'text-delta', id: 'fallback', delta: responseText });
        writer.write({ type: 'text-end', id: 'fallback' });
      },
    }),
  });
}

export async function handleChatRequest(body: { messages: UIMessage[] }) {
  const { messages } = body;

  if (!isLlmEnabled()) {
    return handleFallbackChat(messages);
  }

  const result = streamText({
    model: openai(LLM_MODEL),
    system: COPILOT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: treasuryTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
