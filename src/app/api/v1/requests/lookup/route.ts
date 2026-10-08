import { NextResponse } from "next/server";
import { lookupType } from "@/lib/requests";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const t = lookupType(code);
  if (!t) return NextResponse.json({ error: `Unknown taxonomy code ${code}` }, { status: 404 });
  return NextResponse.json(t);
}
