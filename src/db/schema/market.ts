import {
  pgTable, serial, varchar, text, timestamp, boolean, integer, decimal,
  date, pgEnum, unique, index
} from "drizzle-orm/pg-core";
import { companies, sectors, indices } from "./companies";

export const dataSourceEnum = pgEnum("data_source_type", [
  "manual_import", "csv_upload", "excel_upload", "api_feed", "demo_data", "manual_entry"
]);

export const tradingCalendar = pgTable("trading_calendar", {
  id: serial("id").primaryKey(),
  tradingDate: date("trading_date").notNull().unique(),
  isTrading: boolean("is_trading").notNull().default(true),
  isHalfDay: boolean("is_half_day").notNull().default(false),
  holidayName: varchar("holiday_name", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const importBatches = pgTable("import_batches", {
  id: serial("id").primaryKey(),
  importType: varchar("import_type", { length: 100 }).notNull(),
  fileName: varchar("file_name", { length: 500 }),
  fileUrl: varchar("file_url", { length: 1000 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  totalRows: integer("total_rows"),
  processedRows: integer("processed_rows").default(0),
  errorRows: integer("error_rows").default(0),
  importedBy: integer("imported_by"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorSummary: text("error_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyStockPrices = pgTable("daily_stock_prices", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  tradingDate: date("trading_date").notNull(),
  open: decimal("open", { precision: 12, scale: 4 }),
  high: decimal("high", { precision: 12, scale: 4 }),
  low: decimal("low", { precision: 12, scale: 4 }),
  close: decimal("close", { precision: 12, scale: 4 }),
  previousClose: decimal("previous_close", { precision: 12, scale: 4 }),
  priceChange: decimal("price_change", { precision: 12, scale: 4 }),
  percentageChange: decimal("percentage_change", { precision: 8, scale: 4 }),
  volume: decimal("volume", { precision: 18, scale: 0 }),
  marketValue: decimal("market_value", { precision: 20, scale: 2 }),
  numberOfTrades: integer("number_of_trades"),
  averagePrice: decimal("average_price", { precision: 12, scale: 4 }),
  weekHigh52: decimal("week_high_52", { precision: 12, scale: 4 }),
  weekLow52: decimal("week_low_52", { precision: 12, scale: 4 }),
  upperCircuit: decimal("upper_circuit", { precision: 12, scale: 4 }),
  lowerCircuit: decimal("lower_circuit", { precision: 12, scale: 4 }),
  marketCap: decimal("market_cap", { precision: 24, scale: 2 }),
  dataSource: dataSourceEnum("data_source").notNull().default("manual_import"),
  importBatchId: integer("import_batch_id").references(() => importBatches.id),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.symbol, t.tradingDate),
  index("idx_daily_company_date").on(t.companyId, t.tradingDate),
  index("idx_daily_symbol_date").on(t.symbol, t.tradingDate),
  index("idx_daily_date").on(t.tradingDate),
]);

export const weeklyStockPrices = pgTable("weekly_stock_prices", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  weekStartDate: date("week_start_date").notNull(),
  weekEndDate: date("week_end_date").notNull(),
  firstTradingDay: date("first_trading_day"),
  lastTradingDay: date("last_trading_day"),
  weeklyOpen: decimal("weekly_open", { precision: 12, scale: 4 }),
  weeklyHigh: decimal("weekly_high", { precision: 12, scale: 4 }),
  weeklyLow: decimal("weekly_low", { precision: 12, scale: 4 }),
  weeklyClose: decimal("weekly_close", { precision: 12, scale: 4 }),
  previousWeekClose: decimal("previous_week_close", { precision: 12, scale: 4 }),
  weeklyPriceChange: decimal("weekly_price_change", { precision: 12, scale: 4 }),
  weeklyPctChange: decimal("weekly_pct_change", { precision: 8, scale: 4 }),
  totalWeeklyVolume: decimal("total_weekly_volume", { precision: 20, scale: 0 }),
  avgDailyVolume: decimal("avg_daily_volume", { precision: 18, scale: 0 }),
  totalWeeklyValue: decimal("total_weekly_value", { precision: 24, scale: 2 }),
  avgDailyValue: decimal("avg_daily_value", { precision: 22, scale: 2 }),
  totalWeeklyTrades: integer("total_weekly_trades"),
  tradingSessionsCount: integer("trading_sessions_count"),
  bestDayDate: date("best_day_date"),
  worstDayDate: date("worst_day_date"),
  weeklyVolatility: decimal("weekly_volatility", { precision: 8, scale: 4 }),
  distFrom52WeekHigh: decimal("dist_from_52_week_high", { precision: 8, scale: 4 }),
  distFrom52WeekLow: decimal("dist_from_52_week_low", { precision: 8, scale: 4 }),
  dataCompleteness: varchar("data_completeness", { length: 20 }).notNull().default("complete"),
  calculationVersion: integer("calculation_version").notNull().default(1),
  sourceDailyIds: text("source_daily_ids"),
  lastCalculatedAt: timestamp("last_calculated_at", { withTimezone: true }).notNull().defaultNow(),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.symbol, t.weekStartDate),
  index("idx_weekly_symbol_week").on(t.symbol, t.weekStartDate),
  index("idx_weekly_week").on(t.weekStartDate),
  index("idx_weekly_company_week").on(t.companyId, t.weekStartDate),
]);

export const dailyIndexValues = pgTable("daily_index_values", {
  id: serial("id").primaryKey(),
  indexId: integer("index_id").notNull().references(() => indices.id),
  indexCode: varchar("index_code", { length: 50 }).notNull(),
  tradingDate: date("trading_date").notNull(),
  open: decimal("open", { precision: 14, scale: 4 }),
  high: decimal("high", { precision: 14, scale: 4 }),
  low: decimal("low", { precision: 14, scale: 4 }),
  close: decimal("close", { precision: 14, scale: 4 }),
  previousClose: decimal("previous_close", { precision: 14, scale: 4 }),
  change: decimal("change", { precision: 14, scale: 4 }),
  percentageChange: decimal("percentage_change", { precision: 8, scale: 4 }),
  volume: decimal("volume", { precision: 20, scale: 0 }),
  marketValue: decimal("market_value", { precision: 24, scale: 2 }),
  dataSource: dataSourceEnum("data_source").notNull().default("manual_import"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.indexCode, t.tradingDate),
  index("idx_daily_index_date").on(t.indexCode, t.tradingDate),
]);

export const weeklyIndexValues = pgTable("weekly_index_values", {
  id: serial("id").primaryKey(),
  indexId: integer("index_id").notNull().references(() => indices.id),
  indexCode: varchar("index_code", { length: 50 }).notNull(),
  weekStartDate: date("week_start_date").notNull(),
  weekEndDate: date("week_end_date").notNull(),
  weeklyOpen: decimal("weekly_open", { precision: 14, scale: 4 }),
  weeklyHigh: decimal("weekly_high", { precision: 14, scale: 4 }),
  weeklyLow: decimal("weekly_low", { precision: 14, scale: 4 }),
  weeklyClose: decimal("weekly_close", { precision: 14, scale: 4 }),
  previousWeekClose: decimal("previous_week_close", { precision: 14, scale: 4 }),
  weeklyChange: decimal("weekly_change", { precision: 14, scale: 4 }),
  weeklyPctChange: decimal("weekly_pct_change", { precision: 8, scale: 4 }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.indexCode, t.weekStartDate),
]);

export const marketDailySummaries = pgTable("market_daily_summaries", {
  id: serial("id").primaryKey(),
  tradingDate: date("trading_date").notNull().unique(),
  totalCompanies: integer("total_companies"),
  advancers: integer("advancers"),
  decliners: integer("decliners"),
  unchanged: integer("unchanged"),
  totalVolume: decimal("total_volume", { precision: 22, scale: 0 }),
  totalValue: decimal("total_value", { precision: 26, scale: 2 }),
  totalTrades: integer("total_trades"),
  totalMarketCap: decimal("total_market_cap", { precision: 28, scale: 2 }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const marketWeeklySummaries = pgTable("market_weekly_summaries", {
  id: serial("id").primaryKey(),
  weekStartDate: date("week_start_date").notNull().unique(),
  weekEndDate: date("week_end_date").notNull(),
  totalCompanies: integer("total_companies"),
  weeklyAdvancers: integer("weekly_advancers"),
  weeklyDecliners: integer("weekly_decliners"),
  weeklyUnchanged: integer("weekly_unchanged"),
  totalWeeklyVolume: decimal("total_weekly_volume", { precision: 24, scale: 0 }),
  totalWeeklyValue: decimal("total_weekly_value", { precision: 28, scale: 2 }),
  totalWeeklyTrades: integer("total_weekly_trades"),
  tradingDays: integer("trading_days"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailySectorSummaries = pgTable("daily_sector_summaries", {
  id: serial("id").primaryKey(),
  sectorId: integer("sector_id").notNull().references(() => sectors.id),
  tradingDate: date("trading_date").notNull(),
  totalCompanies: integer("total_companies"),
  advancers: integer("advancers"),
  decliners: integer("decliners"),
  unchanged: integer("unchanged"),
  totalVolume: decimal("total_volume", { precision: 22, scale: 0 }),
  totalValue: decimal("total_value", { precision: 26, scale: 2 }),
  totalMarketCap: decimal("total_market_cap", { precision: 28, scale: 2 }),
  avgPercentageChange: decimal("avg_percentage_change", { precision: 8, scale: 4 }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.sectorId, t.tradingDate),
  index("idx_sector_date").on(t.sectorId, t.tradingDate),
]);

export const weeklySectorSummaries = pgTable("weekly_sector_summaries", {
  id: serial("id").primaryKey(),
  sectorId: integer("sector_id").notNull().references(() => sectors.id),
  weekStartDate: date("week_start_date").notNull(),
  weekEndDate: date("week_end_date").notNull(),
  totalCompanies: integer("total_companies"),
  weeklyAdvancers: integer("weekly_advancers"),
  weeklyDecliners: integer("weekly_decliners"),
  weeklyUnchanged: integer("weekly_unchanged"),
  totalWeeklyVolume: decimal("total_weekly_volume", { precision: 24, scale: 0 }),
  totalWeeklyValue: decimal("total_weekly_value", { precision: 28, scale: 2 }),
  avgWeeklyPctChange: decimal("avg_weekly_pct_change", { precision: 8, scale: 4 }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.sectorId, t.weekStartDate),
]);

export const companyAnnouncements = pgTable("company_announcements", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  symbol: varchar("symbol", { length: 20 }),
  announcementType: varchar("announcement_type", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  announcementDate: date("announcement_date").notNull(),
  fileUrl: varchar("file_url", { length: 1000 }),
  isPublic: boolean("is_public").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const financialResults = pgTable("financial_results", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(),
  announcementDate: date("announcement_date"),
  revenue: decimal("revenue", { precision: 24, scale: 2 }),
  grossProfit: decimal("gross_profit", { precision: 24, scale: 2 }),
  netProfit: decimal("net_profit", { precision: 24, scale: 2 }),
  eps: decimal("eps", { precision: 12, scale: 4 }),
  fileUrl: varchar("file_url", { length: 1000 }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dividends = pgTable("dividends", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  dividendType: varchar("dividend_type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 4 }),
  announceDate: date("announce_date"),
  bookCloseDate: date("book_close_date"),
  paymentDate: date("payment_date"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const researchReports = pgTable("research_reports", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  reportType: varchar("report_type", { length: 100 }).notNull(),
  author: varchar("author", { length: 255 }),
  publicationDate: date("publication_date").notNull(),
  summary: text("summary"),
  fileUrl: varchar("file_url", { length: 1000 }),
  coverImageUrl: varchar("cover_image_url", { length: 1000 }),
  relatedSymbol: varchar("related_symbol", { length: 20 }),
  relatedSectorId: integer("related_sector_id").references(() => sectors.id),
  isPublic: boolean("is_public").notNull().default(true),
  tags: text("tags"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aggregationJobs = pgTable("aggregation_jobs", {
  id: serial("id").primaryKey(),
  jobType: varchar("job_type", { length: 100 }).notNull(),
  weekStartDate: date("week_start_date"),
  weekEndDate: date("week_end_date"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  symbolsProcessed: integer("symbols_processed"),
  warningsCount: integer("warnings_count").default(0),
  errorMessage: text("error_message"),
  triggeredBy: varchar("triggered_by", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dataQualityIssues = pgTable("data_quality_issues", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  issueType: varchar("issue_type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("warning"),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedScreeners = pgTable("saved_screeners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: varchar("name", { length: 255 }).notNull(),
  filters: text("filters").notNull(),
  columns: text("columns"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const watchlistItems = pgTable("watchlist_items", {
  id: serial("id").primaryKey(),
  watchlistId: integer("watchlist_id").notNull().references(() => watchlists.id, { onDelete: "cascade" }),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
