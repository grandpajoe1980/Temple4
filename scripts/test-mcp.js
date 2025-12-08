// Simple Node test script to POST an MCP envelope to the MCP endpoint.
// Uses `MCP_URL` and `MCP_API_KEY` from environment if available.

const DEFAULT_MCP_URL = 'https://mcp.supabase.com/mcp?project_ref=ldpjrsfotjokdhqnzcjj';
const MCP_URL = process.env.MCP_URL || DEFAULT_MCP_URL;
const MCP_API_KEY = process.env.MCP_API_KEY || process.env.MCP_KEY || '';

async function run() {
  console.log('[test-mcp] Using MCP_URL:', MCP_URL);
  const payload = { method: 'GET', path: '/' };
  const headers = { 'content-type': 'application/json' };
  if (MCP_API_KEY) headers['authorization'] = `Bearer ${MCP_API_KEY}`;

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (controller) setTimeout(() => controller.abort(), 30000);

    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined,
    });

    const text = await res.text();
    console.log('[test-mcp] status:', res.status);
    try {
      console.log('[test-mcp] body:', JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      console.log('[test-mcp] body (raw):', text);
    }
  } catch (err) {
    console.error('[test-mcp] request failed:', err);
    process.exitCode = 2;
  }
}

run();
