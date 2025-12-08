# Using the external Supabase MCP

This project can use an external MCP server to perform Supabase (or other) actions on behalf of the application.

Environment variables
- `MCP_URL` (optional): URL of the MCP endpoint. Defaults to the Supabase MCP URL for the project used during the conversation. Example:
  - `https://mcp.supabase.com/mcp?project_ref=ldpjrsfotjokdhqnzcjj`
- `MCP_API_KEY` (optional): API key or bearer token for authenticating with the MCP server. If present it will be sent as `Authorization: Bearer <key>`.

Usage
- A small helper is available at `lib/mcp.ts` which exports `mcpRequest()` and `mcpProxyRest()`.
- `mcpRequest(payload)` posts `payload` to `MCP_URL` as JSON and returns the parsed JSON response. It includes retries and basic error handling.

Example
1. Set env (or add to encrypted secrets and let `instrumentation.ts` load them):

```
MCP_URL=https://mcp.supabase.com/mcp?project_ref=ldpjrsfotjokdhqnzcjj
MCP_API_KEY=<your-key-if-needed>
```

2. Use in server code (TypeScript):

```
import { mcpProxyRest } from '../lib/mcp';

const resp = await mcpProxyRest('/rest/v1/tenants', 'GET');
console.log(resp);
```

Notes
- MCP protocol shapes can vary — `lib/mcp.ts` sends a simple envelope of `{ method, path, headers, body }`. If your MCP expects a different payload shape, adjust `lib/mcp.ts` accordingly.
- For production, put `MCP_URL` and `MCP_API_KEY` in the encrypted secrets file so `instrumentation.ts` will load them early in startup.
