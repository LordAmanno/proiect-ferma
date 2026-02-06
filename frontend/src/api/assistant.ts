import { fetchJson } from './client';

export type AssistantMessage = { role: 'user' | 'assistant'; content: string };

export async function sendAssistantChat(messages: AssistantMessage[], options?: { temperature?: number; maxTokens?: number }) {
  return fetchJson<{ content: string }>('/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens
    })
  });
}
