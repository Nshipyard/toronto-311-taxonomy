import { NextResponse } from "next/server";
import { getData } from "@/lib/requests";

export async function GET() {
  return NextResponse.json(getData().summary);
}
