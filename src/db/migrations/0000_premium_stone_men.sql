CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'data_manager', 'analyst', 'advisor', 'client', 'public');--> statement-breakpoint
CREATE TYPE "public"."shariah_status" AS ENUM('compliant', 'non_compliant', 'under_review', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."data_source_type" AS ENUM('manual_import', 'csv_upload', 'excel_upload', 'api_feed', 'demo_data', 'manual_entry');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100),
	"entity_id" varchar(100),
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'public' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_name" varchar(100),
	"sector_id" integer,
	"description" text,
	"listing_date" date,
	"fiscal_year_end" varchar(10),
	"website" varchar(500),
	"logo_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"isin" varchar(20),
	"free_float" numeric(5, 2),
	"shariah_status" "shariah_status" DEFAULT 'unknown' NOT NULL,
	"shariah_last_reviewed_at" timestamp with time zone,
	"market_cap_category" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "index_constituents" (
	"id" serial PRIMARY KEY NOT NULL,
	"index_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"weight" numeric(8, 4),
	"effective_from" date,
	"effective_to" date,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indices" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "indices_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sectors_name_unique" UNIQUE("name"),
	CONSTRAINT "sectors_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "aggregation_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_type" varchar(100) NOT NULL,
	"week_start_date" date,
	"week_end_date" date,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"symbols_processed" integer,
	"warnings_count" integer DEFAULT 0,
	"error_message" text,
	"triggered_by" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"symbol" varchar(20),
	"announcement_type" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text,
	"announcement_date" date NOT NULL,
	"file_url" varchar(1000),
	"is_public" boolean DEFAULT true NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_index_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"index_id" integer NOT NULL,
	"index_code" varchar(50) NOT NULL,
	"trading_date" date NOT NULL,
	"open" numeric(14, 4),
	"high" numeric(14, 4),
	"low" numeric(14, 4),
	"close" numeric(14, 4),
	"previous_close" numeric(14, 4),
	"change" numeric(14, 4),
	"percentage_change" numeric(8, 4),
	"volume" numeric(20, 0),
	"market_value" numeric(24, 2),
	"data_source" "data_source_type" DEFAULT 'manual_import' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_index_values_index_code_trading_date_unique" UNIQUE("index_code","trading_date")
);
--> statement-breakpoint
CREATE TABLE "daily_sector_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"sector_id" integer NOT NULL,
	"trading_date" date NOT NULL,
	"total_companies" integer,
	"advancers" integer,
	"decliners" integer,
	"unchanged" integer,
	"total_volume" numeric(22, 0),
	"total_value" numeric(26, 2),
	"total_market_cap" numeric(28, 2),
	"avg_percentage_change" numeric(8, 4),
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_sector_summaries_sector_id_trading_date_unique" UNIQUE("sector_id","trading_date")
);
--> statement-breakpoint
CREATE TABLE "daily_stock_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"trading_date" date NOT NULL,
	"open" numeric(12, 4),
	"high" numeric(12, 4),
	"low" numeric(12, 4),
	"close" numeric(12, 4),
	"previous_close" numeric(12, 4),
	"price_change" numeric(12, 4),
	"percentage_change" numeric(8, 4),
	"volume" numeric(18, 0),
	"market_value" numeric(20, 2),
	"number_of_trades" integer,
	"average_price" numeric(12, 4),
	"week_high_52" numeric(12, 4),
	"week_low_52" numeric(12, 4),
	"upper_circuit" numeric(12, 4),
	"lower_circuit" numeric(12, 4),
	"market_cap" numeric(24, 2),
	"data_source" "data_source_type" DEFAULT 'manual_import' NOT NULL,
	"import_batch_id" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_stock_prices_symbol_trading_date_unique" UNIQUE("symbol","trading_date")
);
--> statement-breakpoint
CREATE TABLE "data_quality_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(100),
	"issue_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(20) DEFAULT 'warning' NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dividends" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"dividend_type" varchar(50) NOT NULL,
	"amount" numeric(10, 4),
	"announce_date" date,
	"book_close_date" date,
	"payment_date" date,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"period" varchar(50) NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"announcement_date" date,
	"revenue" numeric(24, 2),
	"gross_profit" numeric(24, 2),
	"net_profit" numeric(24, 2),
	"eps" numeric(12, 4),
	"file_url" varchar(1000),
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"import_type" varchar(100) NOT NULL,
	"file_name" varchar(500),
	"file_url" varchar(1000),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"total_rows" integer,
	"processed_rows" integer DEFAULT 0,
	"error_rows" integer DEFAULT 0,
	"imported_by" integer,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"error_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_daily_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"trading_date" date NOT NULL,
	"total_companies" integer,
	"advancers" integer,
	"decliners" integer,
	"unchanged" integer,
	"total_volume" numeric(22, 0),
	"total_value" numeric(26, 2),
	"total_trades" integer,
	"total_market_cap" numeric(28, 2),
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_daily_summaries_trading_date_unique" UNIQUE("trading_date")
);
--> statement-breakpoint
CREATE TABLE "market_weekly_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_start_date" date NOT NULL,
	"week_end_date" date NOT NULL,
	"total_companies" integer,
	"weekly_advancers" integer,
	"weekly_decliners" integer,
	"weekly_unchanged" integer,
	"total_weekly_volume" numeric(24, 0),
	"total_weekly_value" numeric(28, 2),
	"total_weekly_trades" integer,
	"trading_days" integer,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_weekly_summaries_week_start_date_unique" UNIQUE("week_start_date")
);
--> statement-breakpoint
CREATE TABLE "research_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"report_type" varchar(100) NOT NULL,
	"author" varchar(255),
	"publication_date" date NOT NULL,
	"summary" text,
	"file_url" varchar(1000),
	"cover_image_url" varchar(1000),
	"related_symbol" varchar(20),
	"related_sector_id" integer,
	"is_public" boolean DEFAULT true NOT NULL,
	"tags" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_screeners" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"filters" text NOT NULL,
	"columns" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "trading_calendar" (
	"id" serial PRIMARY KEY NOT NULL,
	"trading_date" date NOT NULL,
	"is_trading" boolean DEFAULT true NOT NULL,
	"is_half_day" boolean DEFAULT false NOT NULL,
	"holiday_name" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trading_calendar_trading_date_unique" UNIQUE("trading_date")
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"watchlist_id" integer NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_index_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"index_id" integer NOT NULL,
	"index_code" varchar(50) NOT NULL,
	"week_start_date" date NOT NULL,
	"week_end_date" date NOT NULL,
	"weekly_open" numeric(14, 4),
	"weekly_high" numeric(14, 4),
	"weekly_low" numeric(14, 4),
	"weekly_close" numeric(14, 4),
	"previous_week_close" numeric(14, 4),
	"weekly_change" numeric(14, 4),
	"weekly_pct_change" numeric(8, 4),
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_index_values_index_code_week_start_date_unique" UNIQUE("index_code","week_start_date")
);
--> statement-breakpoint
CREATE TABLE "weekly_sector_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"sector_id" integer NOT NULL,
	"week_start_date" date NOT NULL,
	"week_end_date" date NOT NULL,
	"total_companies" integer,
	"weekly_advancers" integer,
	"weekly_decliners" integer,
	"weekly_unchanged" integer,
	"total_weekly_volume" numeric(24, 0),
	"total_weekly_value" numeric(28, 2),
	"avg_weekly_pct_change" numeric(8, 4),
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_sector_summaries_sector_id_week_start_date_unique" UNIQUE("sector_id","week_start_date")
);
--> statement-breakpoint
CREATE TABLE "weekly_stock_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"week_start_date" date NOT NULL,
	"week_end_date" date NOT NULL,
	"first_trading_day" date,
	"last_trading_day" date,
	"weekly_open" numeric(12, 4),
	"weekly_high" numeric(12, 4),
	"weekly_low" numeric(12, 4),
	"weekly_close" numeric(12, 4),
	"previous_week_close" numeric(12, 4),
	"weekly_price_change" numeric(12, 4),
	"weekly_pct_change" numeric(8, 4),
	"total_weekly_volume" numeric(20, 0),
	"avg_daily_volume" numeric(18, 0),
	"total_weekly_value" numeric(24, 2),
	"avg_daily_value" numeric(22, 2),
	"total_weekly_trades" integer,
	"trading_sessions_count" integer,
	"best_day_date" date,
	"worst_day_date" date,
	"weekly_volatility" numeric(8, 4),
	"dist_from_52_week_high" numeric(8, 4),
	"dist_from_52_week_low" numeric(8, 4),
	"data_completeness" varchar(20) DEFAULT 'complete' NOT NULL,
	"calculation_version" integer DEFAULT 1 NOT NULL,
	"source_daily_ids" text,
	"last_calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_stock_prices_symbol_week_start_date_unique" UNIQUE("symbol","week_start_date")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_constituents" ADD CONSTRAINT "index_constituents_index_id_indices_id_fk" FOREIGN KEY ("index_id") REFERENCES "public"."indices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_constituents" ADD CONSTRAINT "index_constituents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_announcements" ADD CONSTRAINT "company_announcements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_index_values" ADD CONSTRAINT "daily_index_values_index_id_indices_id_fk" FOREIGN KEY ("index_id") REFERENCES "public"."indices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_sector_summaries" ADD CONSTRAINT "daily_sector_summaries_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stock_prices" ADD CONSTRAINT "daily_stock_prices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stock_prices" ADD CONSTRAINT "daily_stock_prices_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_results" ADD CONSTRAINT "financial_results_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_related_sector_id_sectors_id_fk" FOREIGN KEY ("related_sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_watchlist_id_watchlists_id_fk" FOREIGN KEY ("watchlist_id") REFERENCES "public"."watchlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_index_values" ADD CONSTRAINT "weekly_index_values_index_id_indices_id_fk" FOREIGN KEY ("index_id") REFERENCES "public"."indices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_sector_summaries" ADD CONSTRAINT "weekly_sector_summaries_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_stock_prices" ADD CONSTRAINT "weekly_stock_prices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_index_date" ON "daily_index_values" USING btree ("index_code","trading_date");--> statement-breakpoint
CREATE INDEX "idx_sector_date" ON "daily_sector_summaries" USING btree ("sector_id","trading_date");--> statement-breakpoint
CREATE INDEX "idx_daily_company_date" ON "daily_stock_prices" USING btree ("company_id","trading_date");--> statement-breakpoint
CREATE INDEX "idx_daily_symbol_date" ON "daily_stock_prices" USING btree ("symbol","trading_date");--> statement-breakpoint
CREATE INDEX "idx_daily_date" ON "daily_stock_prices" USING btree ("trading_date");--> statement-breakpoint
CREATE INDEX "idx_weekly_symbol_week" ON "weekly_stock_prices" USING btree ("symbol","week_start_date");--> statement-breakpoint
CREATE INDEX "idx_weekly_week" ON "weekly_stock_prices" USING btree ("week_start_date");--> statement-breakpoint
CREATE INDEX "idx_weekly_company_week" ON "weekly_stock_prices" USING btree ("company_id","week_start_date");