/*
 * Lightweight MCP client helper
 * - Uses `MCP_URL` (env) or the provided Supabase MCP URL as default
 * - Optionally uses `MCP_API_KEY` sent as `Authorization: Bearer ...`
 * - Exports `mcpRequest` which POSTs to the MCP endpoint with a JSON payload
 */

const DEFAULT_MCP_URL = 'https://mcp.supabase.com/mcp?project_ref=ldpjrsfotjokdhqnzcjj';

const MCP_URL = process.env.MCP_URL || DEFAULT_MCP_URL;
const MCP_API_KEY = process.env.MCP_API_KEY || process.env.MCP_KEY || '';

type MCPPayload = {
  // The MCP server may accept arbitrary payload shapes depending on implementation.
  // We'll send a small envelope: { method, path, headers, body }
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  body?: any;
};

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function mcpRequest(payload: MCPPayload, opts?: { retries?: number; timeoutMs?: number }) {
  const retries = opts?.retries ?? 3;
  const timeoutMs = opts?.timeoutMs ?? 30_000;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (MCP_API_KEY) headers['authorization'] = `Bearer ${MCP_API_KEY}`;

  let attempt = 0;
  let lastErr: any = null;
  while (attempt <= retries) {
    attempt += 1;
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (controller) setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(MCP_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined,
      } as any);

      const text = await res.text();
      let data: any = text;
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        const err = new Error(`MCP request failed (${res.status}): ${res.statusText}`);
        // attach response body for debugging
        (err as any).status = res.status;
        (err as any).body = data;
        throw err;
      }

      return data;
    } catch (err) {
      lastErr = err;
      if (attempt > retries) break;
      const delay = 200 * Math.pow(2, attempt - 1);
      // small jitter
      const jitter = Math.round(Math.random() * 100);
      await sleep(delay + jitter);
    }
  }

  throw lastErr;
}

// Example convenience wrapper if using REST-like proxying through MCP
export async function mcpProxyRest(path: string, method = 'GET', body?: any) {
  const payload: MCPPayload = { method, path, body };
  return await mcpRequest(payload);
}

export default {
  mcpRequest,
  mcpProxyRest,
};
