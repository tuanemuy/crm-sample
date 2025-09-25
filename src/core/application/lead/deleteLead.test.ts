import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import { type DeleteLeadInput, deleteLead } from "./deleteLead";

let db: Database;
let context: Context;

describe("deleteLead", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate lead ID format", async () => {
      const invalidInputs = [
        {
          id: "invalid-uuid",
        },
        {
          id: "",
        },
        {
          id: "123-456-789",
        },
        {
          id: uuidv7().substring(0, 30), // Truncated UUID
        },
      ];

      for (const input of invalidInputs) {
        const result = await deleteLead(context, input as DeleteLeadInput);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
      }
    });

    it("should accept valid UUID format", async () => {
      const validId = uuidv7();

      // This will fail because lead doesn't exist, but validation should pass
      const result = await deleteLead(context, { id: validId });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toBe("Lead not found");
    });
  });

  describe("lead not found", () => {
    it("should return error when lead does not exist", async () => {
      const nonExistentId = uuidv7();

      const input: DeleteLeadInput = {
        id: nonExistentId,
      };

      const result = await deleteLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Lead not found");
    });
  });

  describe("successful lead deletion", () => {
    it("should delete lead with new status", async () => {
      // Create a lead first
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 50,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isOk()).toBe(true);

      // Verify lead is deleted by trying to find it
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeNull();
    });

    it("should delete lead with contacted status", async () => {
      // Create a lead first
      const leadResult = await context.leadRepository.create({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        status: "contacted",
        score: 75,
        tags: ["important"],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isOk()).toBe(true);

      // Verify lead is deleted
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeNull();
    });

    it("should delete lead with qualified status", async () => {
      // Create a lead first
      const leadResult = await context.leadRepository.create({
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob@example.com",
        status: "qualified",
        score: 85,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isOk()).toBe(true);

      // Verify lead is deleted
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeNull();
    });

    it("should delete lead with rejected status", async () => {
      // Create a lead first
      const leadResult = await context.leadRepository.create({
        firstName: "Alice",
        lastName: "Wilson",
        email: "alice@example.com",
        status: "rejected",
        score: 25,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isOk()).toBe(true);

      // Verify lead is deleted
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeNull();
    });

    it("should delete lead with complete data", async () => {
      // Create a user first for assignment
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a lead with all fields
      const leadResult = await context.leadRepository.create({
        firstName: "Complete",
        lastName: "Lead",
        email: "complete@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "qualified",
        score: 90,
        assignedUserId: user.id,
        tags: ["enterprise", "high-value"],
        notes: "Important lead with complete information",
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isOk()).toBe(true);

      // Verify lead is deleted
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeNull();
    });
  });

  describe("converted lead protection", () => {
    it("should prevent deletion of converted leads", async () => {
      // Create a lead first
      const leadResult = await context.leadRepository.create({
        firstName: "Converted",
        lastName: "Lead",
        email: "converted@example.com",
        status: "converted",
        score: 100,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Cannot delete converted lead. Please archive instead.",
      );

      // Verify lead still exists
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeDefined();
      expect(findResult._unsafeUnwrap()?.status).toBe("converted");
    });
  });

  describe("edge cases", () => {
    it("should handle lead with minimal data", async () => {
      // Create a lead with minimal required fields
      const leadResult = await context.leadRepository.create({
        firstName: "Min",
        lastName: "Lead",
        status: "new",
        score: 0,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isOk()).toBe(true);

      // Verify lead is deleted
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeNull();
    });

    it("should handle lead with empty optional fields", async () => {
      // Create a lead with empty optional fields
      const leadResult = await context.leadRepository.create({
        firstName: "Empty",
        lastName: "Fields",
        // All optional fields are undefined
        status: "new",
        score: 50,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isOk()).toBe(true);

      // Verify lead is deleted
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeNull();
    });

    it("should handle lead with boundary scores", async () => {
      const boundaryScores = [0, 100];

      for (const score of boundaryScores) {
        // Create a lead with boundary score
        const leadResult = await context.leadRepository.create({
          firstName: "Score",
          lastName: `${score}`,
          email: `score${score}@example.com`,
          status: "new",
          score: score,
          tags: [],
        });
        expect(leadResult.isOk()).toBe(true);
        const lead = leadResult._unsafeUnwrap();

        const input: DeleteLeadInput = {
          id: lead.id,
        };

        const result = await deleteLead(context, input);

        expect(result.isOk()).toBe(true);

        // Verify lead is deleted
        const findResult = await context.leadRepository.findById(lead.id);
        expect(findResult.isOk()).toBe(true);
        expect(findResult._unsafeUnwrap()).toBeNull();
      }
    });

    it("should handle lead with many tags", async () => {
      const manyTags = Array.from({ length: 10 }, (_, i) => `tag${i + 1}`);

      // Create a lead with many tags
      const leadResult = await context.leadRepository.create({
        firstName: "Many",
        lastName: "Tags",
        email: "manytags@example.com",
        status: "new",
        score: 50,
        tags: manyTags,
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isOk()).toBe(true);

      // Verify lead is deleted
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeNull();
    });

    it("should handle lead with long notes", async () => {
      const longNotes = "A".repeat(1000); // Long notes

      // Create a lead with long notes
      const leadResult = await context.leadRepository.create({
        firstName: "Long",
        lastName: "Notes",
        email: "longnotes@example.com",
        status: "new",
        score: 50,
        tags: [],
        notes: longNotes,
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isOk()).toBe(true);

      // Verify lead is deleted
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeNull();
    });
  });

  describe("repository error handling", () => {
    it("should handle find repository failure gracefully", async () => {
      const leadId = uuidv7();

      // Mock the repository findById to return an error
      const originalFindById = context.leadRepository.findById;
      context.leadRepository.findById = async () => {
        return Promise.resolve({
          isErr: () => true,
          isOk: () => false,
          error: new Error("Find repository error"),
        } as any);
      };

      const input: DeleteLeadInput = {
        id: leadId,
      };

      const result = await deleteLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Failed to find lead");

      // Restore original method
      context.leadRepository.findById = originalFindById;
    });

    it("should handle delete repository failure gracefully", async () => {
      // Create a lead first
      const leadResult = await context.leadRepository.create({
        firstName: "Delete",
        lastName: "Error",
        email: "deleteerror@example.com",
        status: "new",
        score: 50,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      // Mock the repository delete to return an error
      const originalDelete = context.leadRepository.delete;
      context.leadRepository.delete = async () => {
        return Promise.resolve({
          isErr: () => true,
          isOk: () => false,
          error: new Error("Delete repository error"),
        } as any);
      };

      const input: DeleteLeadInput = {
        id: lead.id,
      };

      const result = await deleteLead(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Failed to delete lead");

      // Restore original method
      context.leadRepository.delete = originalDelete;

      // Verify lead still exists (wasn't deleted due to error)
      const findResult = await context.leadRepository.findById(lead.id);
      expect(findResult.isOk()).toBe(true);
      expect(findResult._unsafeUnwrap()).toBeDefined();
    });
  });

  describe("concurrent deletion handling", () => {
    it("should handle already deleted lead gracefully", async () => {
      // Create a lead first
      const leadResult = await context.leadRepository.create({
        firstName: "Concurrent",
        lastName: "Delete",
        email: "concurrent@example.com",
        status: "new",
        score: 50,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      // Delete the lead first time
      const firstDeleteResult = await deleteLead(context, { id: lead.id });
      expect(firstDeleteResult.isOk()).toBe(true);

      // Try to delete the same lead again
      const secondDeleteResult = await deleteLead(context, { id: lead.id });
      expect(secondDeleteResult.isErr()).toBe(true);
      expect(secondDeleteResult._unsafeUnwrapErr().message).toBe(
        "Lead not found",
      );
    });
  });

  describe("business logic validation", () => {
    it("should validate all non-converted statuses can be deleted", async () => {
      const deletableStatuses = [
        "new",
        "contacted",
        "qualified",
        "rejected",
      ] as const;

      for (const status of deletableStatuses) {
        // Create a lead with specific status
        const leadResult = await context.leadRepository.create({
          firstName: "Status",
          lastName: status,
          email: `${status}@example.com`,
          status: status,
          score: 50,
          tags: [],
        });
        expect(leadResult.isOk()).toBe(true);
        const lead = leadResult._unsafeUnwrap();

        const input: DeleteLeadInput = {
          id: lead.id,
        };

        const result = await deleteLead(context, input);

        expect(result.isOk()).toBe(true);

        // Verify lead is deleted
        const findResult = await context.leadRepository.findById(lead.id);
        expect(findResult.isOk()).toBe(true);
        expect(findResult._unsafeUnwrap()).toBeNull();
      }
    });

    it("should prevent deletion of all converted leads", async () => {
      // Create multiple converted leads
      const convertedLeadPromises = [];
      for (let i = 1; i <= 3; i++) {
        convertedLeadPromises.push(
          context.leadRepository.create({
            firstName: `Converted${i}`,
            lastName: "Lead",
            email: `converted${i}@example.com`,
            status: "converted",
            score: 100,
            tags: [],
          }),
        );
      }

      const convertedLeadResults = await Promise.all(convertedLeadPromises);
      expect(convertedLeadResults.every((r) => r.isOk())).toBe(true);

      const convertedLeads = convertedLeadResults.map((r) => r._unsafeUnwrap());

      // Try to delete each converted lead
      for (const lead of convertedLeads) {
        const result = await deleteLead(context, { id: lead.id });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr().message).toBe(
          "Cannot delete converted lead. Please archive instead.",
        );

        // Verify lead still exists
        const findResult = await context.leadRepository.findById(lead.id);
        expect(findResult.isOk()).toBe(true);
        expect(findResult._unsafeUnwrap()).toBeDefined();
      }
    });
  });
});
