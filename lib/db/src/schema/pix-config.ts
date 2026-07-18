import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const pixConfigTable = pgTable("pix_config", {
  id: serial("id").primaryKey(),
  chavePix: text("chave_pix").notNull().default("equipehydra.ipnb@gmail.com"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
