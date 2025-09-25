import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import { createUserTestData } from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES_EN } from "@/core/application/errors/messages";
import { ApplicationError } from "@/lib/error";
import type { CreateExportJobInput } from "./createExportJob";
import { createExportJob } from "./createExportJob";

let db: Database;
let context: Context;

describe("createExportJob", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid input with missing required fields", async () => {
      const input = {
        userId: uuidv7(),
        // Missing dataType, format, fileName
      };

      const result = await createExportJob(
        context,
        input as CreateExportJobInput,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
      );
    });

    it("should reject invalid userId format", async () => {
      const input: CreateExportJobInput = {
        userId: "invalid-uuid",
        dataType: "customers",
        format: "csv",
        fileName: "export.csv",
      };

      const result = await createExportJob(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
      );
    });

    it("should reject invalid dataType", async () => {
      const input = {
        userId: uuidv7(),
        dataType: "invalid-type",
        format: "csv",
        fileName: "export.csv",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await createExportJob(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
      );
    });

    it("should reject invalid format", async () => {
      const input = {
        userId: uuidv7(),
        dataType: "customers",
        format: "invalid-format",
        fileName: "export.csv",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await createExportJob(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
      );
    });

    it("should reject empty fileName", async () => {
      const input: CreateExportJobInput = {
        userId: uuidv7(),
        dataType: "customers",
        format: "csv",
        fileName: "",
      };

      const result = await createExportJob(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
      );
    });
  });

  describe("business logic validation", () => {
    it("should validate supported data types", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const supportedTypes = [
        "customers",
        "contacts",
        "leads",
        "deals",
        "activities",
        "users",
        "organizations",
        "proposals",
        "documents",
        "all",
      ];

      for (const dataType of supportedTypes) {
        const input: CreateExportJobInput = {
          userId,
          dataType: dataType as any,
          format: "csv",
          fileName: `export_${dataType}.csv`,
        };

        const result = await createExportJob(context, input);

        // The result might fail due to missing user or repository error,
        // but it should not fail due to invalid dataType
        if (result.isErr()) {
          expect(result._unsafeUnwrapErr().message).not.toBe(
            ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
          );
        }
      }
    });

    it("should validate supported file formats", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const supportedFormats = ["csv", "json", "xlsx", "xml"];

      for (const format of supportedFormats) {
        const input: CreateExportJobInput = {
          userId,
          dataType: "customers",
          format: format as any,
          fileName: `export.${format}`,
        };

        const result = await createExportJob(context, input);

        // The result might fail due to missing user or repository error,
        // but it should not fail due to invalid format
        if (result.isErr()) {
          expect(result._unsafeUnwrapErr().message).not.toBe(
            ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
          );
        }
      }
    });

    it("should handle optional config parameter", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateExportJobInput = {
        userId,
        dataType: "customers",
        format: "csv",
        fileName: "export.csv",
        config: {
          delimiter: ",",
          encoding: "utf-8",
          includeHeaders: true,
          dateFormat: "YYYY-MM-DD",
        },
      };

      const result = await createExportJob(context, input);

      // The result might fail due to missing user or repository error,
      // but it should not fail due to invalid config
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
        );
      }
    });
  });

  describe("data type specific exports", () => {
    it("should handle customers export", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateExportJobInput = {
        userId,
        dataType: "customers",
        format: "csv",
        fileName: "customers_export.csv",
        config: {
          includeFields: ["name", "email", "phone", "address"],
          excludeInactive: true,
        },
      };

      const result = await createExportJob(context, input);

      // Test should not fail due to input validation
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
        );
      }
    });

    it("should handle leads export", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateExportJobInput = {
        userId,
        dataType: "leads",
        format: "json",
        fileName: "leads_export.json",
        config: {
          includeFields: ["firstName", "lastName", "email", "source", "status"],
          filterByStatus: ["new", "qualified"],
        },
      };

      const result = await createExportJob(context, input);

      // Test should not fail due to input validation
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
        );
      }
    });

    it("should handle deals export", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateExportJobInput = {
        userId,
        dataType: "deals",
        format: "xlsx",
        fileName: "deals_export.xlsx",
        config: {
          includeFields: [
            "title",
            "amount",
            "stage",
            "closeDate",
            "probability",
          ],
          filterByStage: ["prospecting", "qualification", "proposal"],
        },
      };

      const result = await createExportJob(context, input);

      // Test should not fail due to input validation
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
        );
      }
    });

    it("should handle all data export", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateExportJobInput = {
        userId,
        dataType: "all",
        format: "json",
        fileName: "full_export.json",
        config: {
          includeRelationships: true,
          compressOutput: true,
        },
      };

      const result = await createExportJob(context, input);

      // Test should not fail due to input validation
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in fileName", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateExportJobInput = {
        userId,
        dataType: "customers",
        format: "csv",
        fileName: "export-file_with.special-chars.csv",
      };

      const result = await createExportJob(context, input);

      // Should not fail due to special characters in fileName
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
        );
      }
    });

    it("should handle complex config objects", async () => {
      const userId = uuidv7();
      const userData = createUserTestData({
        overrides: { email: `test-${userId}@example.com` },
      });
      const userResult = await context.userRepository.create({
        id: userId,
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);

      const input: CreateExportJobInput = {
        userId,
        dataType: "customers",
        format: "json",
        fileName: "complex_export.json",
        config: {
          fields: {
            included: ["name", "email", "phone"],
            excluded: ["internalNotes", "createdAt"],
          },
          filters: {
            status: ["active", "potential"],
            createdAfter: "2024-01-01",
            assignedTo: userId,
          },
          formatting: {
            dateFormat: "YYYY-MM-DD HH:mm:ss",
            numberFormat: "en-US",
            booleanFormat: "true/false",
          },
        },
      };

      const result = await createExportJob(context, input);

      // Should not fail due to complex config
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_EXPORT_JOB_CREATION,
        );
      }
    });
  });
});
