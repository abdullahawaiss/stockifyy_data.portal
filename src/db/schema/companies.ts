import {
  pgTable, serial, varchar, text, timestamp, boolean, integer, decimal, date, pgEnum
} from "drizzle-orm/pg-core";

export const shariahStatusEnum = pgEnum("shariah_status", ["compliant", "non_compliant", "under_review", "unknown"]);

export const sectors = pgTable("sectors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 100 }),
  sectorId: integer("sector_id").references(() => sectors.id),
  description: text("description"),
  listingDate: date("listing_date"),
  fiscalYearEnd: varchar("fiscal_year_end", { length: 10 }),
  website: varchar("website", { length: 500 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  isin: varchar("isin", { length: 20 }),
  freeFloat: decimal("free_float", { precision: 5, scale: 2 }),
  shariahStatus: shariahStatusEnum("shariah_status").notNull().default("unknown"),
  shariahLastReviewedAt: timestamp("shariah_last_reviewed_at", { withTimezone: true }),
  marketCapCategory: varchar("market_cap_category", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const indices = pgTable("indices", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const indexConstituents = pgTable("index_constituents", {
  id: serial("id").primaryKey(),
  indexId: integer("index_id").notNull().references(() => indices.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  weight: decimal("weight", { precision: 8, scale: 4 }),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  isActive: boolean("is_active").notNull().default(true),
});
