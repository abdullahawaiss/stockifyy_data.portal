import { NextRequest, NextResponse } from "next/server";
import { getSession, canAccess } from "@/lib/auth";
import { db } from "@/db";
import { importBatches, dailyStockPrices, companies, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parse } from "csv-parse/sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canAccess(session, "data_manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const ALLOWED_IMPORT_TYPES = ["daily_stock_prices"] as const;
    const rawImportType = formData.get("importType") as string ?? "daily_stock_prices";
    const importType = ALLOWED_IMPORT_TYPES.includes(rawImportType as typeof ALLOWED_IMPORT_TYPES[number])
      ? rawImportType
      : null;
    if (!importType) {
      return NextResponse.json({ error: "Invalid importType" }, { status: 400 });
    }

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });

    const text = await file.text();
    let records: Record<string, string>[];

    try {
      records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
    } catch (parseErr) {
      return NextResponse.json({ success: false, message: "Failed to parse CSV: " + String(parseErr) }, { status: 400 });
    }

    const [batch] = await db.insert(importBatches).values({
      importType,
      fileName: file.name,
      status: "processing",
      totalRows: records.length,
      importedBy: session?.id,
      startedAt: new Date(),
    }).returning();

    let processed = 0;
    const errors: string[] = [];

    if (importType === "daily_stock_prices") {
      const CHUNK = 200;
      for (let i = 0; i < records.length; i += CHUNK) {
        const chunk = records.slice(i, i + CHUNK);
        const inserts = [];
        for (const row of chunk) {
          const symbol = (row.symbol ?? row.Symbol ?? "").toUpperCase().trim();
          const dateStr = row.date ?? row.Date ?? row.trading_date ?? "";
          if (!symbol || !dateStr) { errors.push(`Row ${i + processed}: missing symbol or date`); continue; }

          const [co] = await db.select({ id: companies.id }).from(companies).where(eq(companies.symbol, symbol)).limit(1);
          if (!co) { errors.push(`Row ${i + processed}: unknown symbol ${symbol}`); continue; }

          inserts.push({
            companyId: co.id,
            symbol,
            tradingDate: dateStr,
            open: row.open ?? row.Open ?? null,
            high: row.high ?? row.High ?? null,
            low: row.low ?? row.Low ?? null,
            close: row.close ?? row.Close ?? null,
            previousClose: row.previous_close ?? row.prev_close ?? null,
            volume: row.volume ?? row.Volume ?? null,
            marketValue: row.market_value ?? row.value ?? null,
            numberOfTrades: row.trades ? parseInt(row.trades) : null,
            dataSource: "csv_upload" as const,
            importBatchId: batch.id,
            isDemo: false,
          });
          processed++;
        }
        if (inserts.length > 0) {
          await db.insert(dailyStockPrices).values(inserts).onConflictDoNothing();
        }
      }
    } else {
      errors.push(`Import type '${importType}' not yet implemented. Use daily_stock_prices.`);
    }

    await db.update(importBatches).set({
      status: errors.length > 0 && processed === 0 ? "failed" : "completed",
      processedRows: processed,
      errorRows: errors.length,
      completedAt: new Date(),
      errorSummary: errors.slice(0, 10).join("; "),
    }).where(eq(importBatches.id, batch.id));

    await db.insert(auditLogs).values({
      userId: session?.id,
      action: "data_import",
      entityType: "import_batch",
      entityId: String(batch.id),
      newValue: { importType, fileName: file.name, processed, errors: errors.length, ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown" },
    });

    return NextResponse.json({
      success: processed > 0,
      message: `Imported ${processed} records. ${errors.length} errors.`,
      batchId: batch.id,
      processed,
      errors: errors.slice(0, 5),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Import failed. Please check your file and try again." }, { status: 500 });
  }
}
