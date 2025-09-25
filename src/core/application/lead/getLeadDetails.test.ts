import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError, NotFoundError } from "@/lib/error";
import { getLeadDetails } from "./getLeadDetails";

let db: Database;
let context: Context;

describe("getLeadDetails", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should reject empty leadId", async () => {
      const result = await getLeadDetails(context, "");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject undefined leadId", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await getLeadDetails(context, undefined as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject null leadId", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
      const result = await getLeadDetails(context, null as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("business logic validation", () => {
    it("should return error for non-existent lead", async () => {
      const nonExistentLeadId = uuidv7();

      const result = await getLeadDetails(context, nonExistentLeadId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
      expect(result._unsafeUnwrapErr().message).toBe("Lead not found");
    });
  });

  describe("successful retrieval", () => {
    it("should return lead details for existing lead", async () => {
      // Create a lead
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "new",
        score: 75,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const result = await getLeadDetails(context, lead.id);

      expect(result.isOk()).toBe(true);
      const leadDetails = result._unsafeUnwrap();

      expect(leadDetails).toHaveProperty("id");
      expect(leadDetails).toHaveProperty("firstName");
      expect(leadDetails).toHaveProperty("lastName");
      expect(leadDetails).toHaveProperty("email");
      expect(leadDetails).toHaveProperty("phone");
      expect(leadDetails).toHaveProperty("company");
      expect(leadDetails).toHaveProperty("title");
      expect(leadDetails).toHaveProperty("source");
      expect(leadDetails).toHaveProperty("status");
      expect(leadDetails).toHaveProperty("score");

      expect(leadDetails.id).toBe(lead.id);
      expect(leadDetails.firstName).toBe("John");
      expect(leadDetails.lastName).toBe("Doe");
      expect(leadDetails.email).toBe("john.doe@example.com");
      expect(leadDetails.phone).toBe("123-456-7890");
      expect(leadDetails.company).toBe("Test Company");
      expect(leadDetails.title).toBe("Manager");
      expect(leadDetails.source).toBe("website");
      expect(leadDetails.status).toBe("new");
      expect(leadDetails.score).toBe(75);
    });

    it("should return lead with assigned user information", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a lead with assigned user
      const leadResult = await context.leadRepository.create({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "987-654-3210",
        company: "Another Company",
        title: "Director",
        source: "referral",
        status: "qualified",
        score: 90,
        assignedUserId: user.id,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const result = await getLeadDetails(context, lead.id);

      expect(result.isOk()).toBe(true);
      const leadDetails = result._unsafeUnwrap();

      expect(leadDetails.id).toBe(lead.id);
      expect(leadDetails.firstName).toBe("Jane");
      expect(leadDetails.lastName).toBe("Smith");
      expect(leadDetails.email).toBe("jane.smith@example.com");
      expect(leadDetails.assignedUserId).toBe(user.id);
    });
  });

  describe("data structure validation", () => {
    it("should return lead with proper structure", async () => {
      // Create a lead
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "new",
        score: 75,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const result = await getLeadDetails(context, lead.id);

      expect(result.isOk()).toBe(true);
      const leadDetails = result._unsafeUnwrap();

      // Check core fields
      expect(typeof leadDetails.id).toBe("string");
      expect(typeof leadDetails.firstName).toBe("string");
      expect(typeof leadDetails.lastName).toBe("string");
      expect(typeof leadDetails.email).toBe("string");
      expect(typeof leadDetails.phone).toBe("string");
      expect(typeof leadDetails.company).toBe("string");
      expect(typeof leadDetails.title).toBe("string");
      expect(typeof leadDetails.source).toBe("string");
      expect(typeof leadDetails.status).toBe("string");
      expect(typeof leadDetails.score).toBe("number");

      // Check timestamps
      expect(leadDetails.createdAt).toBeInstanceOf(Date);
      expect(leadDetails.updatedAt).toBeInstanceOf(Date);

      // Check optional fields
      if (leadDetails.assignedUserId) {
        expect(typeof leadDetails.assignedUserId).toBe("string");
      }
      if (leadDetails.notes) {
        expect(typeof leadDetails.notes).toBe("string");
      }
    });

    it("should handle leads with all optional fields", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a lead with all optional fields
      const leadResult = await context.leadRepository.create({
        firstName: "Complete",
        lastName: "Lead",
        email: "complete@example.com",
        phone: "555-1234",
        company: "Complete Company",
        title: "CEO",
        source: "email",
        status: "qualified",
        score: 95,
        assignedUserId: user.id,
        notes: "This is a complete lead with all fields",
        industry: "Technology",
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const result = await getLeadDetails(context, lead.id);

      expect(result.isOk()).toBe(true);
      const leadDetails = result._unsafeUnwrap();

      expect(leadDetails.firstName).toBe("Complete");
      expect(leadDetails.lastName).toBe("Lead");
      expect(leadDetails.email).toBe("complete@example.com");
      expect(leadDetails.assignedUserId).toBe(user.id);
      expect(leadDetails.notes).toBe("This is a complete lead with all fields");
    });
  });

  describe("edge cases", () => {
    it("should handle lead with minimal required fields", async () => {
      // Create a lead with minimal fields
      const leadResult = await context.leadRepository.create({
        firstName: "Min",
        lastName: "Lead",
        email: "min@example.com",
        company: "Min Company",
        source: "other",
        status: "new",
        score: 0,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const result = await getLeadDetails(context, lead.id);

      expect(result.isOk()).toBe(true);
      const leadDetails = result._unsafeUnwrap();

      expect(leadDetails.firstName).toBe("Min");
      expect(leadDetails.lastName).toBe("Lead");
      expect(leadDetails.email).toBe("min@example.com");
      expect(leadDetails.company).toBe("Min Company");
      expect(leadDetails.source).toBe("other");
      expect(leadDetails.status).toBe("new");
      expect(leadDetails.score).toBe(0);
    });

    it("should handle various lead statuses", async () => {
      const statuses = [
        "new",
        "contacted",
        "qualified",
        "rejected",
        "converted",
      ] as const;

      for (const status of statuses) {
        const leadResult = await context.leadRepository.create({
          firstName: "Test",
          lastName: `Lead ${status}`,
          email: `test.${status}@example.com`,
          company: "Test Company",
          source: "website",
          status,
          score: 50,
          tags: [],
        });
        expect(leadResult.isOk()).toBe(true);
        const lead = leadResult._unsafeUnwrap();

        const result = await getLeadDetails(context, lead.id);

        expect(result.isOk()).toBe(true);
        const leadDetails = result._unsafeUnwrap();

        expect(leadDetails.status).toBe(status);
        expect(leadDetails.lastName).toBe(`Lead ${status}`);
      }
    });

    it("should handle various lead sources", async () => {
      const sources = [
        "website",
        "email",
        "phone",
        "referral",
        "social",
        "advertisement",
        "other",
      ];

      for (const source of sources) {
        const leadResult = await context.leadRepository.create({
          firstName: "Test",
          lastName: `Lead ${source}`,
          email: `test.${source}@example.com`,
          company: "Test Company",
          source,
          status: "new",
          score: 50,
          tags: [],
        });
        expect(leadResult.isOk()).toBe(true);
        const lead = leadResult._unsafeUnwrap();

        const result = await getLeadDetails(context, lead.id);

        expect(result.isOk()).toBe(true);
        const leadDetails = result._unsafeUnwrap();

        expect(leadDetails.source).toBe(source);
        expect(leadDetails.lastName).toBe(`Lead ${source}`);
      }
    });

    it("should handle various score ranges", async () => {
      const scores = [0, 25, 50, 75, 100];

      for (const score of scores) {
        const leadResult = await context.leadRepository.create({
          firstName: "Test",
          lastName: `Lead Score ${score}`,
          email: `test.score${score}@example.com`,
          company: "Test Company",
          source: "website",
          status: "new",
          score,
          tags: [],
        });
        expect(leadResult.isOk()).toBe(true);
        const lead = leadResult._unsafeUnwrap();

        const result = await getLeadDetails(context, lead.id);

        expect(result.isOk()).toBe(true);
        const leadDetails = result._unsafeUnwrap();

        expect(leadDetails.score).toBe(score);
        expect(leadDetails.lastName).toBe(`Lead Score ${score}`);
      }
    });
  });
});
