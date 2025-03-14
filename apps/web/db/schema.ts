import { pgTable, serial, text, varchar, timestamp } from 'drizzle-orm/pg-core';

export const pollTable = pgTable('votes', {
  id: serial('id').primaryKey(),
  option: text('option').notNull(),
  ipAddress: text('ip_address').notNull(),
});

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  // Using camelCase in JavaScript but mapping to database column names
  firstname: varchar('firstname', { length: 100 }).notNull(),
  lastname: varchar('lastname', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdat: timestamp('createdat').defaultNow().notNull(),
  updatedat: timestamp('updatedat').defaultNow().notNull(),
});
