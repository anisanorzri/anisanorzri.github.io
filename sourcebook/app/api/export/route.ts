import { EXPORT_HEADER, exportRow } from "@/lib/brief";
import { toCsv } from "@/lib/csv";
import { briefsWithStatus, statusesFrom } from "@/lib/shortlist";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const scope = new URL(req.url).searchParams.get("scope");
  const briefs = await briefsWithStatus(statusesFrom(scope));
  const csv = toCsv(EXPORT_HEADER, briefs.map(exportRow));
  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="sourcebook-shortlist-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
