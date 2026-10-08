import { NextResponse } from "next/server";
import { getData, lookupWard } from "@/lib/requests";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const { wards } = getData();
  if (code) {
    const w = lookupWard(code);
    if (!w) return NextResponse.json({ error: `Unknown ward code ${code}` }, { status: 404 });
    return NextResponse.json(w);
  }
  return NextResponse.json({ wards });
}
