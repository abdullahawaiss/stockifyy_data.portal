// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _psxCache: { rows: any[]; sectors: any[]; ts: number } | null = null;

const PSX_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://dps.psx.com.pk/",
  "Accept": "text/html,application/xhtml+xml,*/*",
};

// Returns all PSX live rows, cached for 60 seconds
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPsxRows(): Promise<{ rows: any[]; sectors: any[] } | null> {
  const now = Date.now();
  if (_psxCache && now - _psxCache.ts < 60_000) {
    return { rows: _psxCache.rows, sectors: _psxCache.sectors };
  }

  try {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 4000);

    const [symbolsRes, mktRes] = await Promise.all([
      fetch("https://dps.psx.com.pk/symbols", {
        headers: { ...PSX_HEADERS, Accept: "application/json" },
        cache: "no-store",
        signal: abort.signal,
      }),
      fetch("https://dps.psx.com.pk/market-watch", {
        headers: PSX_HEADERS,
        cache: "no-store",
        signal: abort.signal,
      }),
    ]);
    clearTimeout(timer);

    if (!symbolsRes.ok || !mktRes.ok) return null;

    type PsxSym = { symbol: string; name: string; sectorName: string };
    const symbolsJson: PsxSym[] = await symbolsRes.json();
    const mktHtml: string = await mktRes.text();
    const symInfo = new Map(symbolsJson.map(s => [s.symbol, s]));

    const date = new Date().toISOString().slice(0, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = [];
    const trRe = /<tr>([\s\S]*?)<\/tr>/g;
    let m;

    while ((m = trRe.exec(mktHtml)) !== null) {
      const row = m[1];
      const symM = row.match(/data-search="(\w+)"/);
      if (!symM) continue;
      const symbol = symM[1];

      const nameM = row.match(/data-title="([^"]+)"/);
      const companyName = nameM ? nameM[1].trim() : (symInfo.get(symbol)?.name ?? symbol);

      // data-order values: [symbol, ldcp, open, high, low, close, change, pct, volume]
      const orders = [...row.matchAll(/data-order="([^"]+)"/g)].map(x => x[1]);
      if (orders.length < 9) continue;

      const tdContents = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => x[1].replace(/<[^>]+>/g, "").trim());
      const indicesRaw = tdContents[2] ?? "";
      const indexCodes = [...new Set(
        indicesRaw.split(",").map(s => s.trim()).filter(Boolean).map(c => {
          if (c === "KSE100" || c === "KSE100PR") return "KSE100";
          if (c === "KSE30") return "KSE30";
          if (c === "KMI30") return "KMI30";
          if (c === "KMIALLSHR" || c === "KMIALL") return "KMIALL";
          return c;
        })
      )];

      const sectorName = symInfo.get(symbol)?.sectorName ?? "Unknown";
      const [, ldcp, open, high, low, close, change, changePct, volume] = orders;

      rows.push({
        symbol, tradingDate: date,
        open, high, low, close,
        previousClose: ldcp,
        priceChange: change,
        percentageChange: changePct,
        volume,
        marketValue: String((parseFloat(close) * parseInt(volume)).toFixed(0)),
        numberOfTrades: Math.floor(parseInt(volume) / 1200),
        weekHigh52: null, weekLow52: null,
        upperCircuit: null, lowerCircuit: null,
        isDemo: false,
        companyName, sectorName,
        sectorId: null, shariahStatus: null,
        indexCodes,
      });
    }

    if (rows.length < 10) return null;

    const allSectorNames = [...new Set(rows.map(r => r.sectorName))].sort();
    const sectorIdMap = new Map<string, number>();
    allSectorNames.forEach((name, i) => sectorIdMap.set(name, i + 1));
    const sectors = allSectorNames.map(name => ({ id: sectorIdMap.get(name)!, name }));
    rows.forEach(r => { r.sectorId = sectorIdMap.get(r.sectorName) ?? null; });

    _psxCache = { rows, sectors, ts: now };
    return { rows, sectors };
  } catch {
    return null;
  }
}

// Find a single stock row by exact symbol (uses cache)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPsxRow(symbol: string): Promise<any | null> {
  const data = await getPsxRows();
  if (!data) return null;
  return data.rows.find(r => r.symbol === symbol) ?? null;
}

export interface PsxIndexValue {
  code: string;
  close: number;
  change: number;
  pct: number;
  vol: number;
}

let _idxCache: { data: PsxIndexValue[]; ts: number } | null = null;

// Parse index values from any HTML blob (looks for number patterns near index names)
function parseIndicesFromHtml(html: string): PsxIndexValue[] {
  const results: PsxIndexValue[] = [];
  const INDEX_NAMES: Record<string, string> = {
    "KSE100": "KSE100", "KSE-100": "KSE100", "KSE 100": "KSE100",
    "KSE30": "KSE30", "KSE-30": "KSE30",
    "ALLSHR": "ALLSHR", "KSE ALL": "ALLSHR",
    "KMI30": "KMI30", "KMI-30": "KMI30",
    "KMIALLSHR": "KMIALLSHR", "KMI ALL": "KMIALLSHR",
  };
  // Try table rows first
  const tableRows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const [, row] of tableRows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(c => c[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim());
    if (cells.length < 2) continue;
    const rawCode = cells[0]?.replace(/\s+/g, " ").trim().toUpperCase();
    const code = INDEX_NAMES[rawCode];
    if (!code) continue;
    const close = parseFloat(cells[1]?.replace(/,/g, ""));
    if (!close || close < 1000) continue;
    const change = parseFloat(cells[2]?.replace(/,/g, "")) || 0;
    const pct = parseFloat(cells[3]?.replace(/[^0-9.-]/g, "")) || 0;
    results.push({ code, close, change, pct, vol: 0 });
  }
  if (results.length > 0) return results;

  // Fallback: scan for index name + number pairs anywhere in HTML
  for (const [name, code] of Object.entries(INDEX_NAMES)) {
    const re = new RegExp(name.replace(/[-]/g, "[-\\s]?") + "[\\s\\S]{0,100}?([\\d,]{6,}(?:\\.\\d+)?)", "i");
    const m = html.match(re);
    if (m) {
      const close = parseFloat(m[1].replace(/,/g, ""));
      if (close > 1000) results.push({ code, close, change: 0, pct: 0, vol: 0 });
    }
  }
  return results;
}

// Scrape live index values — tries multiple PSX endpoints
export async function getPsxIndices(): Promise<PsxIndexValue[]> {
  const now = Date.now();
  if (_idxCache && now - _idxCache.ts < 60_000) return _idxCache.data;

  const ENDPOINTS = [
    "https://dps.psx.com.pk/indices",
    "https://dps.psx.com.pk/market-summary",
    "https://dps.psx.com.pk/",
  ];

  for (const url of ENDPOINTS) {
    try {
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), 3500);
      const res = await fetch(url, {
        headers: { ...PSX_HEADERS, Accept: "application/json, text/html, */*" },
        cache: "no-store",
        signal: abort.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;

      const text = await res.text();
      let parsed: PsxIndexValue[] = [];

      // Try JSON
      try {
        const json = JSON.parse(text);
        const arr = Array.isArray(json) ? json : (json.data ?? json.indices ?? json.result ?? []);
        if (Array.isArray(arr) && arr.length > 0) {
          parsed = arr.map((r: Record<string, unknown>) => ({
            code:   String(r.code ?? r.index_code ?? r.indexCode ?? r.symbol ?? ""),
            close:  parseFloat(String(r.close ?? r.current ?? r.value ?? r.last ?? 0)) || 0,
            change: parseFloat(String(r.change ?? r.net_change ?? 0)) || 0,
            pct:    parseFloat(String(r.pct ?? r.percentage_change ?? r.changePct ?? 0)) || 0,
            vol:    parseInt(String(r.vol ?? r.volume ?? 0)) || 0,
          })).filter((r: PsxIndexValue) => r.code && r.close > 1000);
        }
      } catch { /* not JSON, try HTML */ }

      // Try HTML
      if (parsed.length === 0) parsed = parseIndicesFromHtml(text);

      if (parsed.length > 0) {
        _idxCache = { data: parsed, ts: now };
        return parsed;
      }
    } catch { /* try next endpoint */ }
  }
  return _idxCache?.data ?? []; // return stale cache if all fail
}
