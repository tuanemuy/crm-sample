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
import type { CreateImportJobInput } from "./createImportJob";
import { createImportJob } from "./createImportJob";

let db: Database;
let context: Context;

describe("createImportJob", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject invalid input with missing required fields", async () => {
      const input = {
        userId: uuidv7(),
        // Missing dataType, format, fileName, filePath
      };

      const result = await createImportJob(
        context,
        input as CreateImportJobInput,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
      );
    });

    it("should reject invalid userId format", async () => {
      const input: CreateImportJobInput = {
        userId: "invalid-uuid",
        dataType: "customers",
        format: "csv",
        fileName: "test.csv",
        filePath: "/tmp/test.csv",
      };

      const result = await createImportJob(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
      );
    });

    it("should reject invalid dataType", async () => {
      const input = {
        userId: uuidv7(),
        dataType: "invalid-type",
        format: "csv",
        fileName: "test.csv",
        filePath: "/tmp/test.csv",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await createImportJob(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
      );
    });

    it("should reject invalid format", async () => {
      const input = {
        userId: uuidv7(),
        dataType: "customers",
        format: "invalid-format",
        fileName: "test.csv",
        filePath: "/tmp/test.csv",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await createImportJob(context, input as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
      );
    });

    it("should reject empty fileName", async () => {
      const input: CreateImportJobInput = {
        userId: uuidv7(),
        dataType: "customers",
        format: "csv",
        fileName: "",
        filePath: "/tmp/test.csv",
      };

      const result = await createImportJob(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
      );
    });

    it("should reject empty filePath", async () => {
      const input: CreateImportJobInput = {
        userId: uuidv7(),
        dataType: "customers",
        format: "csv",
        fileName: "test.csv",
        filePath: "",
      };

      const result = await createImportJob(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
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
        const input: CreateImportJobInput = {
          userId,
          dataType: dataType as any,
          format: "csv",
          fileName: `test_${dataType}.csv`,
          filePath: `/tmp/test_${dataType}.csv`,
        };

        const result = await createImportJob(context, input);

        // The result might fail due to missing user or file validation,
        // but it should not fail due to invalid dataType
        if (result.isErr()) {
          expect(result._unsafeUnwrapErr().message).not.toBe(
            ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
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
        const input: CreateImportJobInput = {
          userId,
          dataType: "customers",
          format: format as any,
          fileName: `test.${format}`,
          filePath: `/tmp/test.${format}`,
        };

        const result = await createImportJob(context, input);

        // The result might fail due to missing user or file validation,
        // but it should not fail due to invalid format
        if (result.isErr()) {
          expect(result._unsafeUnwrapErr().message).not.toBe(
            ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
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

      const input: CreateImportJobInput = {
        userId,
        dataType: "customers",
        format: "csv",
        fileName: "test.csv",
        filePath: "/tmp/test.csv",
        config: {
          delimiter: ",",
          encoding: "utf-8",
          skipRows: 1,
        },
      };

      const result = await createImportJob(context, input);

      // The result might fail due to missing user or file validation,
      // but it should not fail due to invalid config
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
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

      const input: CreateImportJobInput = {
        userId,
        dataType: "customers",
        format: "csv",
        fileName: "test-file_with.special-chars.csv",
        filePath: "/tmp/test-file_with.special-chars.csv",
      };

      const result = await createImportJob(context, input);

      // Should not fail due to special characters in fileName
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
        );
      }
    });

    it("should handle long file paths", async () => {
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

      const longPath = `/tmp/${"a".repeat(200)}/test.csv`;
      const input: CreateImportJobInput = {
        userId,
        dataType: "customers",
        format: "csv",
        fileName: "test.csv",
        filePath: longPath,
      };

      const result = await createImportJob(context, input);

      // Should not fail due to long file path
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
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

      const input: CreateImportJobInput = {
        userId,
        dataType: "customers",
        format: "json",
        fileName: "test.json",
        filePath: "/tmp/test.json",
        config: {
          mapping: {
            customer_name: "name",
            customer_email: "email",
            customer_phone: "phone",
          },
          validation: {
            required: ["name", "email"],
            optional: ["phone", "address"],
          },
          transformation: {
            name: "uppercase",
            email: "lowercase",
          },
        },
      };

      const result = await createImportJob(context, input);

      // Should not fail due to complex config
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toBe(
          ERROR_MESSAGES_EN.INVALID_INPUT_IMPORT_JOB_CREATION,
        );
      }
    });
  });
});
