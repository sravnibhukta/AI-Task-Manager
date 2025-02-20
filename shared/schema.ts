import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: serial("user_id").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks)
  .pick({
    title: true,
    completed: true,
  })
  .extend({
    title: z.string().min(1, "Title is required").max(100),
  });

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
  })
  .extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;