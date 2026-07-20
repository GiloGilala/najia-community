import {
  pgTable,
  uuid,
  integer,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { lawyers } from "./lawyers.ts";
import { users } from "./users.ts";

/**
 * A citizen's review of a lawyer. A reviewer may review a given lawyer once
 * (unique (lawyer_id, reviewer_id)). `reviewer_id` is stored for uniqueness
 * and audit but never surfaced in public display. `anonymous` hides the
 * reviewer's name; `moderated` excludes the review from ratings and the public
 * list.
 *
 * See .scratch/lawyer-reviews/spec.md (architecture §5.5).
 */
export const lawyerReviews = pgTable(
  "lawyer_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lawyerId: uuid("lawyer_id").notNull(),
    reviewerId: uuid("reviewer_id").notNull(),
    rating: integer("rating").notNull(), // 1–5
    comment: text("comment"),
    anonymous: boolean("anonymous").notNull().default(false),
    moderated: boolean("moderated").notNull().default(false),
    response: text("response"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.lawyerId], foreignColumns: [lawyers.userId] }).onDelete(
      "cascade",
    ),
    foreignKey({ columns: [table.reviewerId], foreignColumns: [users.id] }).onDelete(
      "cascade",
    ),
    uniqueIndex("lawyer_reviews_lawyer_reviewer_unique").on(
      table.lawyerId,
      table.reviewerId,
    ),
  ],
);

export type LawyerReviewRow = typeof lawyerReviews.$inferSelect;
