import { pgTable, uuid, text, foreignKey } from "drizzle-orm/pg-core";

/**
 * Normalized location hierarchy for residency-based poll eligibility.
 *
 * A national jurisdiction contains its states; a state contains its local
 * government areas (LGAs). `parentId` links a node to its containing node,
 * allowing an ancestor walk to decide residency scope: a User whose
 * jurisdiction equals or is a descendant of a poll's jurisdiction may vote.
 *
 * See .scratch/policy-polls/spec.md.
 */
export const jurisdictions = pgTable(
  "jurisdictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    level: text("level").notNull(), // "national" | "state" | "local"
    parentId: uuid("parent_id"),
  },
  (table) => [
    foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }).onDelete(
      "set null",
    ),
  ],
);

export type JurisdictionRow = typeof jurisdictions.$inferSelect;

/** Jurisdiction hierarchy levels, root to leaf. */
export type JurisdictionLevel = "national" | "state" | "local";
