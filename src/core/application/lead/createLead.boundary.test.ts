import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import { createUserTestData } from "@/core/adapters/drizzlePglite/testFactories";
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

describe("createLead - Boundary Value Tests", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("First Name Boundary Values", () => {
    it("should reject lead with empty first name", async () => {
      const input: CreateLeadInput = {
        firstName: "",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
    });

    it("should create lead with minimum first name length (1 character)", async () => {
      const input: CreateLeadInput = {
        firstName: "J",
        lastName: "Doe",
        email: "j@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("J");
    });

    it("should create lead with maximum first name length (100 characters)", async () => {
      const longFirstName = "A".repeat(100);
      const input: CreateLeadInput = {
        firstName: longFirstName,
        lastName: "Doe",
        email: "long@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe(longFirstName);
    });

    it("should reject lead with first name exceeding maximum length (101 characters)", async () => {
      const tooLongFirstName = "A".repeat(101);
      const input: CreateLeadInput = {
        firstName: tooLongFirstName,
        lastName: "Doe",
        email: "toolong@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
    });
  });

  describe("Last Name Boundary Values", () => {
    it("should reject lead with empty last name", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "",
        email: "john@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
    });

    it("should create lead with minimum last name length (1 character)", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "D",
        email: "john@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.lastName).toBe("D");
    });

    it("should create lead with maximum last name length (100 characters)", async () => {
      const longLastName = "B".repeat(100);
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: longLastName,
        email: "john@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.lastName).toBe(longLastName);
    });

    it("should reject lead with last name exceeding maximum length (101 characters)", async () => {
      const tooLongLastName = "B".repeat(101);
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: tooLongLastName,
        email: "john@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
    });
  });

  describe("Email Boundary Values", () => {
    it("should create lead with valid email", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.email).toBe("john.doe@example.com");
    });

    it("should create lead with shortest valid email", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "a@b.co",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.email).toBe("a@b.co");
    });

    it("should create lead with long valid email", async () => {
      const longEmail = `${"a".repeat(50)}@${"b".repeat(50)}.com`;
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: longEmail,
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.email).toBe(longEmail);
    });

    it("should create lead with complex valid email", async () => {
      const complexEmail = "john.doe+test@sub.example-domain.co.uk";
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: complexEmail,
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.email).toBe(complexEmail);
    });

    it("should reject lead with invalid email format (no @)", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "johndoe.example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
    });

    it("should reject lead with invalid email format (no domain)", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
    });

    it("should reject lead with invalid email format (no local part)", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
    });

    it("should reject lead with invalid email format (multiple @)", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@doe@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
    });

    it("should create lead without email (optional field)", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.email).toBeUndefined();
    });
  });

  describe("Tags Array Boundary Values", () => {
    it("should create lead with empty tags array", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.tags).toEqual([]);
    });

    it("should create lead with single tag", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: ["hot"],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.tags).toEqual(["hot"]);
    });

    it("should create lead with multiple tags", async () => {
      const tags = ["hot", "qualified", "enterprise", "decision-maker"];
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: tags,
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.tags).toEqual(tags);
    });

    it("should create lead with many tags (stress test)", async () => {
      const tags = Array.from({ length: 50 }, (_, i) => `tag-${i + 1}`);
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: tags,
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.tags).toEqual(tags);
    });

    it("should create lead with very long tag names", async () => {
      const longTag = "a".repeat(100);
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: [longTag],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.tags).toEqual([longTag]);
    });

    it("should create lead with duplicate tags", async () => {
      const tags = ["hot", "qualified", "hot", "enterprise"];
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: tags,
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.tags).toEqual(tags); // Should preserve duplicates
    });

    it("should create lead with tags containing special characters", async () => {
      const specialTags = ["C++", "2023-Q4", "VP-Finance", "North America"];
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        tags: specialTags,
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.tags).toEqual(specialTags);
    });
  });

  describe("Optional Fields Boundary Values", () => {
    it("should create lead with all optional fields provided", async () => {
      // Create a user for assignment
      const userData = createUserTestData();
      const userResult = await context.userRepository.create({
        ...userData,
        passwordHash: "hash",
        isActive: true,
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1-555-123-4567",
        company: "Acme Corp",
        title: "VP of Engineering",
        industry: "Technology",
        source: "website",
        notes: "Very interested in our enterprise solution",
        assignedUserId: user.id,
        tags: ["hot", "qualified"],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("John");
      expect(lead.lastName).toBe("Doe");
      expect(lead.email).toBe("john@example.com");
      expect(lead.phone).toBe("+1-555-123-4567");
      expect(lead.company).toBe("Acme Corp");
      expect(lead.title).toBe("VP of Engineering");
      expect(lead.industry).toBe("Technology");
      expect(lead.source).toBe("website");
      expect(lead.notes).toBe("Very interested in our enterprise solution");
      expect(lead.assignedUserId).toBe(user.id);
      expect(lead.tags).toEqual(["hot", "qualified"]);
    });

    it("should create lead with no optional fields", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("John");
      expect(lead.lastName).toBe("Doe");
      expect(lead.email).toBeUndefined();
      expect(lead.phone).toBeUndefined();
      expect(lead.company).toBeUndefined();
      expect(lead.title).toBeUndefined();
      expect(lead.industry).toBeUndefined();
      expect(lead.source).toBeUndefined();
      expect(lead.notes).toBeUndefined();
      expect(lead.assignedUserId).toBeUndefined();
      expect(lead.tags).toEqual([]);
    });

    it("should create lead with very long optional text fields", async () => {
      const longText = "A".repeat(1000);
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: longText,
        company: longText,
        title: longText,
        industry: longText,
        source: longText,
        notes: longText,
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.phone).toBe(longText);
      expect(lead.company).toBe(longText);
      expect(lead.title).toBe(longText);
      expect(lead.industry).toBe(longText);
      expect(lead.source).toBe(longText);
      expect(lead.notes).toBe(longText);
    });

    it("should create lead with special characters in optional fields", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1 (555) 123-4567 ext. 890",
        company: "Acme Corp & Co., LLC",
        title: "VP of R&D",
        industry: "Software & Technology",
        source: "Google Ads - Q4 2023",
        notes:
          "Interested in our B2B solution. Budget: $100K+. Timeline: ASAP!",
        tags: ["B2B", "High-Budget", "Q4-2023"],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.phone).toBe("+1 (555) 123-4567 ext. 890");
      expect(lead.company).toBe("Acme Corp & Co., LLC");
      expect(lead.title).toBe("VP of R&D");
      expect(lead.industry).toBe("Software & Technology");
      expect(lead.source).toBe("Google Ads - Q4 2023");
      expect(lead.notes).toBe(
        "Interested in our B2B solution. Budget: $100K+. Timeline: ASAP!",
      );
      expect(lead.tags).toEqual(["B2B", "High-Budget", "Q4-2023"]);
    });

    it("should reject lead with invalid assignedUserId UUID", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        assignedUserId: "invalid-uuid",
        tags: [],
      };

      const result = await createLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        ERROR_MESSAGES.LEAD_INVALID_INPUT,
      );
    });
  });

  describe("Unicode and International Characters", () => {
    it("should create lead with international characters in names", async () => {
      const input: CreateLeadInput = {
        firstName: "José",
        lastName: "García",
        email: "jose.garcia@example.com",
        company: "Société Générale",
        title: "Gérant",
        tags: ["français", "européen"],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("José");
      expect(lead.lastName).toBe("García");
      expect(lead.company).toBe("Société Générale");
      expect(lead.title).toBe("Gérant");
      expect(lead.tags).toEqual(["français", "européen"]);
    });

    it("should create lead with Chinese characters", async () => {
      const input: CreateLeadInput = {
        firstName: "张",
        lastName: "伟",
        email: "zhang.wei@example.com",
        company: "阿里巴巴集团",
        title: "软件工程师",
        tags: ["中文", "技术"],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("张");
      expect(lead.lastName).toBe("伟");
      expect(lead.company).toBe("阿里巴巴集团");
      expect(lead.title).toBe("软件工程师");
      expect(lead.tags).toEqual(["中文", "技术"]);
    });

    it("should create lead with Japanese characters", async () => {
      const input: CreateLeadInput = {
        firstName: "田中",
        lastName: "太郎",
        email: "tanaka.taro@example.com",
        company: "トヨタ自動車株式会社",
        title: "エンジニア",
        tags: ["日本語", "自動車"],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.firstName).toBe("田中");
      expect(lead.lastName).toBe("太郎");
      expect(lead.company).toBe("トヨタ自動車株式会社");
      expect(lead.title).toBe("エンジニア");
      expect(lead.tags).toEqual(["日本語", "自動車"]);
    });

    it("should create lead with emoji characters", async () => {
      const input: CreateLeadInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        company: "Tech Corp 🚀",
        title: "CEO 💼",
        notes: "Very excited about our product! 🎉",
        tags: ["🔥", "💯", "startup"],
      };

      const result = await createLead(context, input);

      expect(result.isOk()).toBe(true);
      const lead = result._unsafeUnwrap();
      expect(lead.company).toBe("Tech Corp 🚀");
      expect(lead.title).toBe("CEO 💼");
      expect(lead.notes).toBe("Very excited about our product! 🎉");
      expect(lead.tags).toEqual(["🔥", "💯", "startup"]);
    });
  });
});
