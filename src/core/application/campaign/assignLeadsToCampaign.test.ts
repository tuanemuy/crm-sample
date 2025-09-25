import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import {
  type AssignLeadsToCampaignInput,
  assignLeadsToCampaign,
} from "./assignLeadsToCampaign";

let db: Database;
let context: Context;

describe("assignLeadsToCampaign", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate campaign assignment requirements", async () => {
      const invalidInputs = [
        {
          campaignId: "invalid-uuid", // Invalid campaign UUID
          leadIds: [uuidv7()],
          userId: uuidv7(),
        },
        {
          campaignId: uuidv7(),
          leadIds: [], // Empty lead IDs array
          userId: uuidv7(),
        },
        {
          campaignId: uuidv7(),
          leadIds: ["invalid-uuid"], // Invalid lead UUID
          userId: uuidv7(),
        },
        {
          campaignId: uuidv7(),
          leadIds: [uuidv7()],
          userId: "invalid-uuid", // Invalid user UUID
        },
      ];

      for (const input of invalidInputs) {
        const result = await assignLeadsToCampaign(
          context,
          input as AssignLeadsToCampaignInput,
        );
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
      }
    });
  });

  describe("campaign validation", () => {
    it("should reject assignment if campaign does not exist", async () => {
      const input: AssignLeadsToCampaignInput = {
        campaignId: uuidv7(),
        leadIds: [uuidv7()],
        userId: uuidv7(),
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe("Campaign not found");
    });
  });

  describe("lead validation", () => {
    it("should reject assignment if lead does not exist", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign first
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      const input: AssignLeadsToCampaignInput = {
        campaignId: campaign.id,
        leadIds: [uuidv7()],
        userId: user.id,
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Leads not found");
    });

    it("should reject assignment if some leads do not exist", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign first
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      // Create one lead
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

      const input: AssignLeadsToCampaignInput = {
        campaignId: campaign.id,
        leadIds: [lead.id, uuidv7()], // One existing, one non-existing
        userId: user.id,
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain("Leads not found");
    });
  });

  describe("successful assignment", () => {
    it("should assign single lead to campaign with minimal fields", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign first
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      // Create a lead
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

      const input: AssignLeadsToCampaignInput = {
        campaignId: campaign.id,
        leadIds: [lead.id],
        userId: user.id,
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaignLeads = result._unsafeUnwrap();
      expect(campaignLeads).toHaveLength(1);
      expect(campaignLeads[0].campaignId).toBe(campaign.id);
      expect(campaignLeads[0].leadId).toBe(lead.id);
      expect(campaignLeads[0].assignedBy).toBe(user.id);
      expect(campaignLeads[0].status).toBe("assigned");
      expect(campaignLeads[0].id).toBeDefined();
      expect(campaignLeads[0].assignedAt).toBeDefined();
    });

    it("should assign multiple leads to campaign", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign first
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      // Create multiple leads
      const lead1Result = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "new",
        score: 50,
        tags: [],
      });
      expect(lead1Result.isOk()).toBe(true);
      const lead1 = lead1Result._unsafeUnwrap();

      const lead2Result = await context.leadRepository.create({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        status: "new",
        score: 75,
        tags: [],
      });
      expect(lead2Result.isOk()).toBe(true);
      const lead2 = lead2Result._unsafeUnwrap();

      const lead3Result = await context.leadRepository.create({
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob@example.com",
        status: "new",
        score: 80,
        tags: [],
      });
      expect(lead3Result.isOk()).toBe(true);
      const lead3 = lead3Result._unsafeUnwrap();

      const input: AssignLeadsToCampaignInput = {
        campaignId: campaign.id,
        leadIds: [lead1.id, lead2.id, lead3.id],
        userId: user.id,
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaignLeads = result._unsafeUnwrap();
      expect(campaignLeads).toHaveLength(3);

      const leadIds = campaignLeads.map((cl) => cl.leadId);
      expect(leadIds).toContain(lead1.id);
      expect(leadIds).toContain(lead2.id);
      expect(leadIds).toContain(lead3.id);

      campaignLeads.forEach((cl) => {
        expect(cl.campaignId).toBe(campaign.id);
        expect(cl.assignedBy).toBe(user.id);
        expect(cl.status).toBe("assigned");
        expect(cl.id).toBeDefined();
        expect(cl.assignedAt).toBeDefined();
      });
    });

    it("should assign leads to campaign with notes", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign first
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      // Create a lead
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

      const input: AssignLeadsToCampaignInput = {
        campaignId: campaign.id,
        leadIds: [lead.id],
        userId: user.id,
        notes: "High-priority lead for Q4 campaign",
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaignLeads = result._unsafeUnwrap();
      expect(campaignLeads).toHaveLength(1);
      expect(campaignLeads[0].notes).toBe("High-priority lead for Q4 campaign");
    });

    it("should assign leads to different campaign types", async () => {
      const campaignTypes = [
        "email",
        "sms",
        "social",
        "event",
        "webinar",
      ] as const;

      for (const campaignType of campaignTypes) {
        // Create a user first
        const userResult = await context.userRepository.create({
          name: "Test User",
          email: `test-${campaignType}@example.com`,
          role: "user",
          isActive: true,
          passwordHash: "hash",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        // Create a campaign first
        const campaignResult = await context.campaignRepository.create({
          name: `Test ${campaignType} Campaign`,
          type: campaignType,
          createdBy: user.id,
          metadata: {},
        });
        expect(campaignResult.isOk()).toBe(true);
        const campaign = campaignResult._unsafeUnwrap();

        // Create a lead
        const leadResult = await context.leadRepository.create({
          firstName: "John",
          lastName: "Doe",
          email: `john-${campaignType}@example.com`,
          status: "new",
          score: 50,
          tags: [],
        });
        expect(leadResult.isOk()).toBe(true);
        const lead = leadResult._unsafeUnwrap();

        const input: AssignLeadsToCampaignInput = {
          campaignId: campaign.id,
          leadIds: [lead.id],
          userId: user.id,
        };

        const result = await assignLeadsToCampaign(context, input);

        expect(result.isOk()).toBe(true);
        const campaignLeads = result._unsafeUnwrap();
        expect(campaignLeads).toHaveLength(1);
        expect(campaignLeads[0].campaignId).toBe(campaign.id);
        expect(campaignLeads[0].leadId).toBe(lead.id);
      }
    });

    it("should assign leads with different statuses to campaign", async () => {
      const leadStatuses = ["new", "contacted", "qualified"] as const;

      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign first
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      const leadIds: string[] = [];

      for (const status of leadStatuses) {
        // Create a lead with specific status
        const leadResult = await context.leadRepository.create({
          firstName: "John",
          lastName: `${status} Lead`,
          email: `john-${status}@example.com`,
          status: status,
          score: 50,
          tags: [],
        });
        expect(leadResult.isOk()).toBe(true);
        const lead = leadResult._unsafeUnwrap();
        leadIds.push(lead.id);
      }

      const input: AssignLeadsToCampaignInput = {
        campaignId: campaign.id,
        leadIds: leadIds,
        userId: user.id,
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaignLeads = result._unsafeUnwrap();
      expect(campaignLeads).toHaveLength(leadStatuses.length);

      campaignLeads.forEach((cl) => {
        expect(cl.campaignId).toBe(campaign.id);
        expect(leadIds).toContain(cl.leadId);
        expect(cl.status).toBe("assigned");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle campaign with different statuses", async () => {
      const campaignStatuses = ["draft", "active", "paused"] as const;

      for (const campaignStatus of campaignStatuses) {
        // Create a user first
        const userResult = await context.userRepository.create({
          name: "Test User",
          email: `test-${campaignStatus}@example.com`,
          role: "user",
          isActive: true,
          passwordHash: "hash",
        });
        expect(userResult.isOk()).toBe(true);
        const user = userResult._unsafeUnwrap();

        // Create a campaign with specific status
        const campaignResult = await context.campaignRepository.create({
          name: `Test ${campaignStatus} Campaign`,
          type: "email",
          createdBy: user.id,
          metadata: {},
        });
        expect(campaignResult.isOk()).toBe(true);
        const campaign = campaignResult._unsafeUnwrap();

        // Update campaign status
        const updateResult = await context.campaignRepository.update({
          id: campaign.id,
          status: campaignStatus,
        });
        expect(updateResult.isOk()).toBe(true);

        // Create a lead
        const leadResult = await context.leadRepository.create({
          firstName: "John",
          lastName: "Doe",
          email: `john-${campaignStatus}@example.com`,
          status: "new",
          score: 50,
          tags: [],
        });
        expect(leadResult.isOk()).toBe(true);
        const lead = leadResult._unsafeUnwrap();

        const input: AssignLeadsToCampaignInput = {
          campaignId: campaign.id,
          leadIds: [lead.id],
          userId: user.id,
        };

        const result = await assignLeadsToCampaign(context, input);

        expect(result.isOk()).toBe(true);
        const campaignLeads = result._unsafeUnwrap();
        expect(campaignLeads).toHaveLength(1);
        expect(campaignLeads[0].campaignId).toBe(campaign.id);
      }
    });

    it("should handle leads with extreme scores", async () => {
      const extremeScores = [0, 100];

      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign first
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      const leadIds: string[] = [];

      for (const score of extremeScores) {
        // Create a lead with extreme score
        const leadResult = await context.leadRepository.create({
          firstName: "John",
          lastName: `Score ${score}`,
          email: `john-score-${score}@example.com`,
          status: "new",
          score: score,
          tags: [],
        });
        expect(leadResult.isOk()).toBe(true);
        const lead = leadResult._unsafeUnwrap();
        leadIds.push(lead.id);
      }

      const input: AssignLeadsToCampaignInput = {
        campaignId: campaign.id,
        leadIds: leadIds,
        userId: user.id,
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaignLeads = result._unsafeUnwrap();
      expect(campaignLeads).toHaveLength(extremeScores.length);
    });

    it("should handle leads with empty optional fields", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign first
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      // Create a lead with minimal fields
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        status: "new",
        score: 50,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: AssignLeadsToCampaignInput = {
        campaignId: campaign.id,
        leadIds: [lead.id],
        userId: user.id,
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaignLeads = result._unsafeUnwrap();
      expect(campaignLeads).toHaveLength(1);
      expect(campaignLeads[0].campaignId).toBe(campaign.id);
      expect(campaignLeads[0].leadId).toBe(lead.id);
    });

    it("should handle assignment with empty notes", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign first
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      // Create a lead
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

      const input: AssignLeadsToCampaignInput = {
        campaignId: campaign.id,
        leadIds: [lead.id],
        userId: user.id,
        notes: "",
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaignLeads = result._unsafeUnwrap();
      expect(campaignLeads).toHaveLength(1);
      expect(campaignLeads[0].notes).toBe("");
    });

    it("should handle large number of leads assignment", async () => {
      // Create a user first
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a campaign first
      const campaignResult = await context.campaignRepository.create({
        name: "Test Campaign",
        type: "email",
        createdBy: user.id,
        metadata: {},
      });
      expect(campaignResult.isOk()).toBe(true);
      const campaign = campaignResult._unsafeUnwrap();

      // Create multiple leads (10 leads for testing)
      const leadIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const leadResult = await context.leadRepository.create({
          firstName: "John",
          lastName: `Doe ${i}`,
          email: `john${i}@example.com`,
          status: "new",
          score: Math.floor(Math.random() * 100),
          tags: [],
        });
        expect(leadResult.isOk()).toBe(true);
        const lead = leadResult._unsafeUnwrap();
        leadIds.push(lead.id);
      }

      const input: AssignLeadsToCampaignInput = {
        campaignId: campaign.id,
        leadIds: leadIds,
        userId: user.id,
      };

      const result = await assignLeadsToCampaign(context, input);

      expect(result.isOk()).toBe(true);
      const campaignLeads = result._unsafeUnwrap();
      expect(campaignLeads).toHaveLength(10);

      campaignLeads.forEach((cl) => {
        expect(cl.campaignId).toBe(campaign.id);
        expect(leadIds).toContain(cl.leadId);
        expect(cl.assignedBy).toBe(user.id);
        expect(cl.status).toBe("assigned");
      });
    });
  });
});
