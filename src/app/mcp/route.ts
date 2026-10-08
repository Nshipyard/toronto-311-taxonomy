import { NextResponse } from "next/server";
import { getData, lookupType, searchTypes, lookupWard } from "@/lib/requests";

// Minimal MCP server over streamable HTTP (JSON-RPC 2.0 via POST).
// Supports: initialize, tools/list, tools/call. Stateless.

const SERVER = { name: "toronto-311-taxonomy", version: "1.0.0" };

const TOOLS = [
  {
    name: "requests_taxonomy",
    description:
      "Search the 952-type 311 taxonomy by text (type, code, section), optionally filtered to one division. Each type carries its T311 code, division, section, 2022-2026 count, and share.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search text, e.g. 'pothole'" },
        division: { type: "string", description: "Division name, e.g. 'Transportation Services'. Optional." },
        limit: { type: "integer", description: "Max results, default 50, max 200." },
      },
      required: [],
    },
  },
  {
    name: "requests_ward_stats",
    description:
      "Backlog statistics for Toronto wards: requests 2022-2026, backlog rate (2022-2024 requests still open), 2020 median household income, and division mix. Omit code for all 25 wards.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Ward code 1-25, e.g. '10'. Optional." },
      },
      required: [],
    },
  },
  {
    name: "requests_lookup",
    description:
      "Full record for one taxonomy code, e.g. 'T311-R0007' (case-insensitive): division, section, request type, count, share.",
    inputSchema: {
      type: "object",
      properties: { code: { type: "string", description: "Taxonomy code, e.g. 'T311-R0007'" } },
      required: ["code"],
    },
  },
];

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function handle(msg: any) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg?.id ?? null, -32600, "Invalid Request");
  }
  const id = msg.id ?? null;
  switch (msg.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args } = msg.params ?? {};
      try {
        if (name === "requests_taxonomy") {
          const rawLimit = parseInt(String(args?.limit ?? "50"), 10);
          const limit = Math.min(Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1), 200);
          const r = searchTypes(String(args?.q ?? ""), String(args?.division ?? ""), limit);
          return ok(id, textResult(r));
        }
        if (name === "requests_ward_stats") {
          const code = String(args?.code ?? "").trim();
          if (code) {
            const w = lookupWard(code);
            if (!w) return err(id, -32001, `Unknown ward code ${args?.code}`);
            return ok(id, textResult(w));
          }
          return ok(id, textResult({ wards: getData().wards }));
        }
        if (name === "requests_lookup") {
          const t = lookupType(String(args?.code ?? ""));
          if (!t) return err(id, -32001, `Unknown taxonomy code ${args?.code}`);
          return ok(id, textResult(t));
        }
        return err(id, -32602, `Unknown tool ${name}`);
      } catch (e) {
        return err(id, -32000, `Tool error: ${(e as Error).message}`);
      }
    }
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.map(handle).filter((r) => r !== null);
    return NextResponse.json(out);
  }
  const out = handle(body);
  if (out === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(out);
}

export async function GET() {
  return NextResponse.json(
    { error: "This MCP server accepts JSON-RPC 2.0 via POST only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}
