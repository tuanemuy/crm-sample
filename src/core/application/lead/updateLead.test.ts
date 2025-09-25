import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { UpdateLeadInput } from "@/core/domain/lead/types";
import { ApplicationError } from "@/lib/error";
import { updateLead } from "./updateLead";

let db: Database;
let context: Context;

describe("updateLead", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate lead update requirements", async () => {
      const invalidInputs = [
        {
          leadId: "invalid-uuid",
          input: { firstName: "Updated", lastName: "Name" },
        }, // Invalid UUID
      ];

      for (const { leadId, input } of invalidInputs) {
        const result = await updateLead(
          context,
          leadId,
          input as UpdateLeadInput,
        );
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain("Lead not found");
      }
    });

    it("should handle empty update data", async () => {
      // Create a lead first
      const userResult = await context.userRepository.create({
        name: "User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const leadResult = await context.leadRepository.create({
        firstName: "Existing",
        lastName: "Lead",
        email: "existing@example.com",
        assignedUserId: user.id,
        source: "website",
        status: "new",
        score: 0,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: UpdateLeadInput = {};

      const result = await updateLead(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const updatedLead = result._unsafeUnwrap();
      expect(updatedLead.firstName).toBe("Existing");
      expect(updatedLead.lastName).toBe("Lead");
      expect(updatedLead.email).toBe("existing@example.com");
      expect(updatedLead.source).toBe("website");
      expect(updatedLead.status).toBe("new");
    });
  });

  describe("lead not found", () => {
    it("should handle lead not found when updating", async () => {
      const leadId = uuidv7();
      const input: UpdateLeadInput = {
        firstName: "Updated",
        lastName: "Lead",
      };

      const result = await updateLead(context, leadId, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Lead not found");
    });
  });

  describe("successful updates", () => {
    it("should update lead with basic information", async () => {
      // Create a user and lead first
      const userResult = await context.userRepository.create({
        name: "User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const leadResult = await context.leadRepository.create({
        firstName: "Original",
        lastName: "Lead",
        email: "original@example.com",
        assignedUserId: user.id,
        source: "website",
        status: "new",
        score: 0,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: UpdateLeadInput = {
        firstName: "Updated",
        lastName: "Lead",
        phone: "+1234567890",
        company: "Updated Company",
      };

      const result = await updateLead(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const updatedLead = result._unsafeUnwrap();
      expect(updatedLead.firstName).toBe("Updated");
      expect(updatedLead.lastName).toBe("Lead");
      expect(updatedLead.phone).toBe("+1234567890");
      expect(updatedLead.company).toBe("Updated Company");
      expect(updatedLead.email).toBe("original@example.com"); // Unchanged
      expect(updatedLead.id).toBe(lead.id);
    });

    it("should update lead status", async () => {
      // Create a user and lead first
      const userResult = await context.userRepository.create({
        name: "User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const leadResult = await context.leadRepository.create({
        firstName: "Lead",
        lastName: "User",
        email: "lead@example.com",
        assignedUserId: user.id,
        source: "website",
        status: "new",
        score: 0,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: UpdateLeadInput = {
        status: "qualified",
      };

      const result = await updateLead(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const updatedLead = result._unsafeUnwrap();
      expect(updatedLead.status).toBe("qualified");
      expect(updatedLead.firstName).toBe("Lead"); // Unchanged
      expect(updatedLead.lastName).toBe("User"); // Unchanged
      expect(updatedLead.email).toBe("lead@example.com"); // Unchanged
    });

    it("should update assigned user", async () => {
      // Create users and lead first
      const user1Result = await context.userRepository.create({
        name: "User 1",
        email: "user1@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(user1Result.isOk()).toBe(true);
      const user1 = user1Result._unsafeUnwrap();

      const user2Result = await context.userRepository.create({
        name: "User 2",
        email: "user2@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(user2Result.isOk()).toBe(true);
      const user2 = user2Result._unsafeUnwrap();

      const leadResult = await context.leadRepository.create({
        firstName: "Lead",
        lastName: "User",
        email: "lead@example.com",
        assignedUserId: user1.id,
        source: "website",
        status: "new",
        score: 0,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: UpdateLeadInput = {
        assignedUserId: user2.id,
      };

      const result = await updateLead(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const updatedLead = result._unsafeUnwrap();
      expect(updatedLead.assignedUserId).toBe(user2.id);
      expect(updatedLead.firstName).toBe("Lead"); // Unchanged
      expect(updatedLead.lastName).toBe("User"); // Unchanged
    });
  });

  describe("edge cases", () => {
    it("should handle all status types", async () => {
      // Create a user and lead first
      const userResult = await context.userRepository.create({
        name: "User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const leadResult = await context.leadRepository.create({
        firstName: "Lead",
        lastName: "User",
        email: "lead@example.com",
        assignedUserId: user.id,
        source: "website",
        status: "new",
        score: 0,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const statuses = [
        "new",
        "contacted",
        "qualified",
        "converted",
        "rejected",
      ];

      for (const status of statuses) {
        const input: UpdateLeadInput = {
          status: status as
            | "new"
            | "contacted"
            | "qualified"
            | "converted"
            | "rejected",
        };

        const result = await updateLead(context, lead.id, input);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().status).toBe(status);
      }
    });

    it("should handle partial updates correctly", async () => {
      // Create a user and lead first
      const userResult = await context.userRepository.create({
        name: "User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const leadResult = await context.leadRepository.create({
        firstName: "Original",
        lastName: "Lead",
        email: "original@example.com",
        phone: "+0000000000",
        company: "Original Company",
        assignedUserId: user.id,
        source: "website",
        status: "new",
        score: 0,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: UpdateLeadInput = {
        firstName: "Only",
        lastName: "Updated",
        // Other fields intentionally omitted
      };

      const result = await updateLead(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const updatedLead = result._unsafeUnwrap();
      expect(updatedLead.firstName).toBe("Only");
      expect(updatedLead.lastName).toBe("Updated");
      expect(updatedLead.email).toBe("original@example.com"); // Unchanged
      expect(updatedLead.phone).toBe("+0000000000"); // Unchanged
      expect(updatedLead.company).toBe("Original Company"); // Unchanged
      expect(updatedLead.status).toBe("new"); // Unchanged
    });
  });
});
