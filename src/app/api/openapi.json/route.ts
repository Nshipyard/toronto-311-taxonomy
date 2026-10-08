import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Toronto 311 Taxonomy API",
    version: "1.0.0",
    description:
      "2,225,151 Toronto 311 service requests (2022-2026) normalized into a versioned taxonomy: division, section, request type. Ward-level backlog analysis with 2021 Census income join. The open dataset contains no completion dates, so resolution is measured as backlog (2022-2024 requests still open), not time-to-close. MIT licensed.",
  },
  servers: [{ url: "https://311.canada.nshipyard.com/api/v1" }],
  paths: {
    "/requests/taxonomy": {
      get: {
        summary: "Full taxonomy hierarchy, or search request types by text",
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" }, example: "pothole" },
          { name: "division", in: "query", required: false, schema: { type: "string" }, example: "Transportation Services" },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50, maximum: 200 } },
        ],
        responses: { "200": { description: "Hierarchy or matching types, capped at limit" } },
      },
    },
    "/requests/wards": {
      get: {
        summary: "Backlog stats for all 25 wards, or one ward by code",
        parameters: [{ name: "code", in: "query", required: false, schema: { type: "string" }, example: "10" }],
        responses: {
          "200": { description: "Ward stats: backlog rate, median income, division mix" },
          "404": { description: "Unknown ward code" },
        },
      },
    },
    "/requests/lookup": {
      get: {
        summary: "One taxonomy code: division, section, count, share",
        parameters: [{ name: "code", in: "query", required: true, schema: { type: "string" }, example: "T311-R0007" }],
        responses: {
          "200": { description: "Request type record" },
          "404": { description: "Unknown taxonomy code" },
        },
      },
    },
    "/requests/summary": {
      get: {
        summary: "Totals, backlog analysis, income correlation, methodology notes",
        responses: { "200": { description: "Summary of the full build" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
