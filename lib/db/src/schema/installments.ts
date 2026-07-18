import { pgTable, serial, integer, numeric, text, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const installmentsTable = pgTable("installments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(), // 1-8
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull().default("7.50"),
  vencimento: date("vencimento").notNull(),
  status: text("status").notNull().default("pendente"), // pendente | pago | atrasado
  dataPago: timestamp("data_pago"),
  comprovante: text("comprovante"), // base64 or URL
  metodoPagamento: text("metodo_pagamento"), // Pix | Dinheiro | Transferência
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInstallmentSchema = createInsertSchema(installmentsTable).omit({ id: true, createdAt: true });
export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;
export type Installment = typeof installmentsTable.$inferSelect;
