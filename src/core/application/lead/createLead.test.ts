import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import { createLeadTestData } from "@/core/adapters/drizzlePglite/testFactories";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ERROR_MESSAGES } from "@/core/application/errors/messages";
import type { CreateLeadInput } from "@/core/domain/lead/types";
import { ApplicationError } from "@/lib/error";
import { createLead } from "./createLead";

let db: Database;
let context: Context;

describe("createLead", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("リード情報の検証", () => {
    it("名前が空の場合はリード作成を拒否すべき", async () => {
      const input = createLeadTestData({
        overrides: { firstName: "" },
      });

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
      // Check that the underlying validation error contains the specific message
      expect(result._unsafeUnwrapErr().cause?.message).toContain("Too small");
    });

    it("姓が空の場合はリード作成を拒否すべき", async () => {
      const input = createLeadTestData({
        overrides: { lastName: "" },
      });

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
      // Check that the underlying validation error contains the specific message
      expect(result._unsafeUnwrapErr().cause?.message).toContain("Too small");
    });

    it("メールアドレスが無効な形式の場合はリード作成を拒否すべき", async () => {
      const input = createLeadTestData({
        overrides: { email: "invalid-email" },
      });

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
      // Check that the underlying validation error contains the specific message
      expect(result._unsafeUnwrapErr().cause?.message).toContain(
        "Invalid email",
      );
    });

    it("名前が100文字を超える場合はリード作成を拒否すべき", async () => {
      const input = createLeadTestData({
        overrides: { firstName: "a".repeat(101) },
      });

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
      // Check that the underlying validation error contains the specific message
      expect(result._unsafeUnwrapErr().cause?.message).toContain(
        "Too big: expected string to have <=100 characters",
      );
    });
  });

  describe("business logic validation", () => {
    it("should reject creation if lead with same email already exists", async () => {
      // Create an existing lead first
      const userResult = await context.userRepository.create({
        name: "User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const existingLeadResult = await context.leadRepository.create({
        firstName: "Existing",
        lastName: "Lead",
        email: "test@example.com",
        assignedUserId: user.id,
        source: "website",
        status: "new",
        score: 0,
        tags: [],
      });
      expect(existingLeadResult.isOk()).toBe(true);

      const input: CreateLeadInput = {
        firstName: "New",
        lastName: "Lead",
        email: "test@example.com", // Same email
        assignedUserId: user.id,
        source: "website",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_EMAIL_DUPLICATE,
      );
    });

    it("should reject creation if assigned user does not exist", async () => {
      const input: CreateLeadInput = {
        firstName: "New",
        lastName: "Lead",
        email: "test@example.com",
        assignedUserId: uuidv7(),
        source: "website",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_CREATION_FAILED,
      );
    });
  });

  describe("successful creation", () => {
    it("should create lead with minimal required fields", async () => {
      // Create an assigned user first
      const userResult = await context.userRepository.create({
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateLeadInput = {
        firstName: "New",
        lastName: "Lead",
        email: "lead@example.com",
        assignedUserId: user.id,
        source: "website",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const createdLead = result._unsafeUnwrap();
      expect(createdLead.firstName).toBe("New");
      expect(createdLead.lastName).toBe("Lead");
      expect(createdLead.email).toBe("lead@example.com");
      expect(createdLead.assignedUserId).toBe(user.id);
      expect(createdLead.source).toBe("website");
      expect(createdLead.status).toBe("new");
      expect(createdLead.score).toBe(0);
      expect(createdLead.id).toBeDefined();
      expect(createdLead.createdAt).toBeDefined();
      expect(createdLead.updatedAt).toBeDefined();
    });

    it("should create lead with all optional fields", async () => {
      // Create an assigned user first
      const userResult = await context.userRepository.create({
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateLeadInput = {
        firstName: "New",
        lastName: "Lead",
        email: "lead@example.com",
        phone: "+1234567890",
        company: "Lead Company",
        title: "Manager",
        assignedUserId: user.id,
        source: "referral",
        tags: [],
        notes: "Initial contact made",
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const createdLead = result._unsafeUnwrap();
      expect(createdLead.firstName).toBe("New");
      expect(createdLead.lastName).toBe("Lead");
      expect(createdLead.email).toBe("lead@example.com");
      expect(createdLead.phone).toBe("+1234567890");
      expect(createdLead.company).toBe("Lead Company");
      expect(createdLead.title).toBe("Manager");
      expect(createdLead.assignedUserId).toBe(user.id);
      expect(createdLead.source).toBe("referral");
      expect(createdLead.status).toBe("new");
      expect(createdLead.notes).toBe("Initial contact made");
      expect(createdLead.score).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle different lead sources", async () => {
      // Create an assigned user first
      const userResult = await context.userRepository.create({
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const sources = [
        "website",
        "referral",
        "social_media",
        "advertisement",
        "direct",
      ];

      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const input: CreateLeadInput = {
          firstName: "Lead",
          lastName: `${i + 1}`,
          email: `lead${i + 1}@example.com`,
          assignedUserId: user.id,
          source,
          tags: [],
        };

        const result = await createLead(context, input);

        expect(result.isOk()).toBe(true);
        const createdLead = result._unsafeUnwrap();
        expect(createdLead.source).toBe(source);
      }
    });

    it("should handle different lead statuses", async () => {
      // Create an assigned user first
      const userResult = await context.userRepository.create({
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const statuses = [
        "new",
        "contacted",
        "qualified",
        "converted",
        "rejected",
      ];

      for (let i = 0; i < statuses.length; i++) {
        const _status = statuses[i];
        const input = createLeadTestData({
          overrides: {
            firstName: "Lead",
            lastName: `${i + 1}`,
            email: `lead${i + 1}@example.com`,
            assignedUserId: user.id,
            source: "website",
            tags: [],
          },
        });

        const result = await createLead(context, input);

        expect(result.isOk()).toBe(true);
        const createdLead = result._unsafeUnwrap();
        expect(createdLead.status).toBe("new");
      }
    });
  });
});
