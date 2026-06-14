const chatRes = await fetch('http://127.0.0.1:3001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', parts: [{ type: 'text', text: '/pay 5$' }] }],
  }),
});
const chatText = await chatRes.text();

const deltas = [];
for (const line of chatText.split('\n')) {
  if (!line.startsWith('data: ')) continue;
  const payload = line.slice(6).trim();
  if (payload === '[DONE]') continue;
  try {
    const event = JSON.parse(payload);
    if (event.type === 'text-delta' && typeof event.delta === 'string') {
      deltas.push(event.delta);
    }
  } catch {
    // ignore non-JSON lines
  }
}

const assembled = deltas.join('');
const toolMatch = assembled.match(/```agentblox-tool\n([\s\S]*?)\n```/);
if (!toolMatch) {
  console.error('FAIL: no tool block in chat response');
  console.error('assembled preview:', assembled.slice(0, 400));
  process.exit(1);
}

const payload = JSON.parse(toolMatch[1]);
const result = payload.result;
console.log('tool status:', result.status);
console.log('payment path:', result.request?.paymentPath);
console.log('signer:', result.request?.signing?.signerAddress);
console.log('onChain:', result.request?.onChain);

if (result.status !== 'proposed') {
  console.error('FAIL: expected status proposed, got', result.status);
  process.exit(1);
}

if (result.request?.onChain?.status === 'preflight_failed') {
  console.error('FAIL: preflight failed:', result.request.onChain.reason);
  process.exit(1);
}

const signedMetaTx = result.request?.signing?.signedMetaTx;
if (!signedMetaTx) {
  console.error('FAIL: no signedMetaTx');
  process.exit(1);
}

const execRes = await fetch('http://127.0.0.1:3001/api/execute/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ signedMetaTx }),
});
const execBody = await execRes.json();
console.log('execute status:', execRes.status);
console.log('execute result:', JSON.stringify(execBody, null, 2));

if (!execBody.ok) {
  console.error('FAIL: execute payment failed');
  process.exit(1);
}

console.log('OK: B-fast /pay 5$ signed and submitted, hash:', execBody.hash);
