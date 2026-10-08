import { NextResponse } from "next/server";
import { getData, searchTypes } from "@/lib/requests";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const division = url.searchParams.get("division") ?? "";
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const limit = Math.min(Math.max(isNaN(limitRaw) ? 50 : limitRaw, 1), 200);
  if (q || division) {
    const r = searchTypes(q, division, limit);
    return NextResponse.json(r);
  }
  const { taxonomy } = getData();
  return NextResponse.json({ divisions: taxonomy });
}
