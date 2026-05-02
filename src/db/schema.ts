import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  numeric,
  date,
  doublePrecision,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const stageStatusEnum = pgEnum("stage_status", [
  "planned",
  "in_progress",
  "completed",
  "on_hold",
]);

export const plotStatusEnum = pgEnum("plot_status", [
  "available",
  "reserved",
  "sold",
  "in_development",
]);

export const financialKindEnum = pgEnum("financial_kind", [
  "expense",
  "income",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
  })
);

export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 255 }),
  nationalId: varchar("national_id", { length: 64 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lands = pgTable("lands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 512 }),
  areaAcres: numeric("area_acres", { precision: 14, scale: 4 }).notNull(),
  purchasePriceEgp: numeric("purchase_price_egp", { precision: 16, scale: 2 }).notNull().default("0"),
  purchaseDate: date("purchase_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const plots = pgTable("plots", {
  id: serial("id").primaryKey(),
  landId: integer("land_id").references(() => lands.id, { onDelete: "cascade" }).notNull(),
  ownerId: integer("owner_id").references(() => people.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  areaAcres: numeric("area_acres", { precision: 14, scale: 4 }).notNull(),
  costEgp: numeric("cost_egp", { precision: 16, scale: 2 }).notNull().default("0"),
  sellingPriceEgp: numeric("selling_price_egp", { precision: 16, scale: 2 }).notNull().default("0"),
  profitPercentage: numeric("profit_percentage", { precision: 7, scale: 4 }),
  status: plotStatusEnum("status").notNull().default("available"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const plotCoordinates = pgTable("plot_coordinates", {
  id: serial("id").primaryKey(),
  plotId: integer("plot_id").references(() => plots.id, { onDelete: "cascade" }).notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const plotDocuments = pgTable("plot_documents", {
  id: serial("id").primaryKey(),
  plotId: integer("plot_id").references(() => plots.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 64 }),
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const plotStages = pgTable("plot_stages", {
  id: serial("id").primaryKey(),
  plotId: integer("plot_id").references(() => plots.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: stageStatusEnum("status").notNull().default("planned"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stageFinancials = pgTable("stage_financials", {
  id: serial("id").primaryKey(),
  stageId: integer("stage_id").references(() => plotStages.id, { onDelete: "cascade" }).notNull(),
  kind: financialKindEnum("kind").notNull(),
  category: varchar("category", { length: 128 }),
  description: text("description"),
  amountEgp: numeric("amount_egp", { precision: 16, scale: 2 }).notNull(),
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const landsRelations = relations(lands, ({ many }) => ({
  plots: many(plots),
}));

export const plotsRelations = relations(plots, ({ one, many }) => ({
  land: one(lands, { fields: [plots.landId], references: [lands.id] }),
  owner: one(people, { fields: [plots.ownerId], references: [people.id] }),
  coordinates: many(plotCoordinates),
  documents: many(plotDocuments),
  stages: many(plotStages),
}));

export const stagesRelations = relations(plotStages, ({ one, many }) => ({
  plot: one(plots, { fields: [plotStages.plotId], references: [plots.id] }),
  financials: many(stageFinancials),
}));

export const financialsRelations = relations(stageFinancials, ({ one }) => ({
  stage: one(plotStages, { fields: [stageFinancials.stageId], references: [plotStages.id] }),
}));

export const peopleRelations = relations(people, ({ many }) => ({
  plots: many(plots),
}));
