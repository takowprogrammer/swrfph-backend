/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LoginSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SecurityEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LoginSession" DROP CONSTRAINT "LoginSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SecurityEvent" DROP CONSTRAINT "SecurityEvent_userId_fkey";

-- DropTable
DROP TABLE "public"."AuditLog";

-- DropTable
DROP TABLE "public"."LoginSession";

-- DropTable
DROP TABLE "public"."SecurityEvent";

-- DropEnum
DROP TYPE "public"."AuditAction";

-- DropEnum
DROP TYPE "public"."AuditSeverity";
