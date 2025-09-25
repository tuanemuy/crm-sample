import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import { createActivity } from "@/core/application/activity/createActivity";
import { updateActivity } from "@/core/application/activity/updateActivity";
import type { Context } from "@/core/application/context";
import { createCustomer } from "@/core/application/customer/createCustomer";
import { createDeal } from "@/core/application/deal/createDeal";
import { updateDealStage } from "@/core/application/deal/updateDealStage";
import { createLead } from "@/core/application/lead/createLead";
import { createUser } from "@/core/application/user/createUser";
import type { CreateActivityInput } from "@/core/domain/activity/types";
import type { CreateCustomerInput } from "@/core/domain/customer/types";
import type { CreateDealInput } from "@/core/domain/deal/types";
import type { CreateLeadInput } from "@/core/domain/lead/types";
import type { CreateUserInput } from "@/core/domain/user/types";

let db: Database;
let context: Context;

describe("Cross-Domain Workflow Tests", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("Lead to Customer Conversion Workflow", () => {
    it("should handle complete lead-to-customer conversion with deal creation", async () => {
      // 1. Create a sales user
      const userInput: CreateUserInput = {
        name: "Sales Rep",
        email: "sales@company.com",
        password: "password123",
        role: "user",
      };
      const userResult = await createUser(context, userInput);
      expect(userResult.isOk()).toBe(true);
      const salesUser = userResult._unsafeUnwrap();

      // 2. Create a lead
      const leadInput: CreateLeadInput = {
        firstName: "John",
        lastName: "Prospect",
        email: "john@prospect.com",
        phone: "123-456-7890",
        company: "Prospect Corp",
        title: "CEO",
        source: "website",
        assignedUserId: salesUser.id,
        tags: ["enterprise", "high-value"],
        notes: "Interested in our enterprise solution",
      };
      const leadResult = await createLead(context, leadInput);
      expect(leadResult.isOk()).toBe(true);
      const _lead = leadResult._unsafeUnwrap();

      // 3. Convert lead to customer
      const customerInput: CreateCustomerInput = {
        name: "Prospect Corp",
        industry: "Technology",
        size: "large",
        assignedUserId: salesUser.id,
        description: "Enterprise client converted from lead",
      };
      const customerResult = await createCustomer(context, customerInput);
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // 4. Create deal for the new customer
      const dealInput: CreateDealInput = {
        title: "Enterprise Software License",
        amount: "50000.00",
        customerId: customer.id,
        assignedUserId: salesUser.id,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        stage: "qualification",
        probability: 80,
        description: "Annual enterprise license deal",
        competitors: [],
      };
      const dealResult = await createDeal(context, dealInput);
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      // 5. Verify the workflow integrity
      expect(customer.assignedUserId).toBe(salesUser.id);
      expect(deal.customerId).toBe(customer.id);
      expect(deal.assignedUserId).toBe(salesUser.id);
      expect(deal.stage).toBe("qualification");

      // 6. Progress the deal through stages
      const stageUpdateResult = await updateDealStage(context, deal.id, {
        stage: "proposal",
        probability: 85,
      });
      expect(stageUpdateResult.isOk()).toBe(true);
      const updatedDeal = stageUpdateResult._unsafeUnwrap();
      expect(updatedDeal.stage).toBe("proposal");
      expect(updatedDeal.probability).toBe(85);
    });

    it("should handle lead qualification workflow with multiple touchpoints", async () => {
      // 1. Create sales manager and rep
      const managerInput: CreateUserInput = {
        name: "Sales Manager",
        email: "manager@company.com",
        password: "password123",
        role: "manager",
      };
      const managerResult = await createUser(context, managerInput);
      expect(managerResult.isOk()).toBe(true);
      const _manager = managerResult._unsafeUnwrap();

      const repInput: CreateUserInput = {
        name: "Sales Rep",
        email: "rep@company.com",
        password: "password123",
        role: "user",
      };
      const repResult = await createUser(context, repInput);
      expect(repResult.isOk()).toBe(true);
      const rep = repResult._unsafeUnwrap();

      // 2. Create lead with low initial score
      const leadInput: CreateLeadInput = {
        firstName: "Jane",
        lastName: "Prospect",
        email: "jane@smallcorp.com",
        company: "Small Corp",
        source: "cold_email",
        assignedUserId: rep.id,
        tags: ["small-business"],
      };
      const leadResult = await createLead(context, leadInput);
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      // 3. Create follow-up activities
      const activityInput: CreateActivityInput = {
        type: "email",
        subject: "Follow-up email sent",
        description: "Sent introduction email about our solution",
        assignedUserId: rep.id,
        leadId: lead.id,
        scheduledAt: new Date(),
        priority: "medium",
      };
      const activityResult = await createActivity(
        context,
        activityInput,
        rep.id,
      );
      expect(activityResult.isOk()).toBe(true);

      // 4. Verify lead assignment and activity linkage
      expect(lead.assignedUserId).toBe(rep.id);
      const activity = activityResult._unsafeUnwrap();
      expect(activity.leadId).toBe(lead.id);
      expect(activity.assignedUserId).toBe(rep.id);
    });
  });

  describe("Deal Lifecycle Workflow", () => {
    it("should handle complete deal lifecycle from creation to closure", async () => {
      // 1. Setup: Create user and customer
      const userInput: CreateUserInput = {
        name: "Account Manager",
        email: "account@company.com",
        password: "password123",
        role: "user",
      };
      const userResult = await createUser(context, userInput);
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const customerInput: CreateCustomerInput = {
        name: "Enterprise Client",
        industry: "Healthcare",
        size: "large",
        assignedUserId: user.id,
      };
      const customerResult = await createCustomer(context, customerInput);
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // 2. Create initial deal
      const dealInput: CreateDealInput = {
        title: "Healthcare Software Implementation",
        amount: "100000.00",
        customerId: customer.id,
        assignedUserId: user.id,
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        stage: "prospecting",
        probability: 20,
        description: "Large healthcare software implementation project",
        competitors: [],
      };
      const dealResult = await createDeal(context, dealInput);
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      // 3. Progress through qualification stage
      const qualificationResult = await updateDealStage(context, deal.id, {
        stage: "qualification",
        probability: 40,
      });
      expect(qualificationResult.isOk()).toBe(true);
      const qualifiedDeal = qualificationResult._unsafeUnwrap();
      expect(qualifiedDeal.stage).toBe("qualification");

      // 4. Create qualification activity
      const qualificationActivityInput: CreateActivityInput = {
        type: "meeting",
        subject: "Qualification Call",
        description: "Discussed requirements and budget",
        assignedUserId: user.id,
        dealId: deal.id,
        customerId: customer.id,
        scheduledAt: new Date(),
        priority: "medium",
      };
      const qualificationActivityResult = await createActivity(
        context,
        qualificationActivityInput,
        user.id,
      );
      expect(qualificationActivityResult.isOk()).toBe(true);

      // 5. Progress to proposal stage
      const proposalResult = await updateDealStage(context, deal.id, {
        stage: "proposal",
        probability: 70,
      });
      expect(proposalResult.isOk()).toBe(true);
      const proposalDeal = proposalResult._unsafeUnwrap();
      expect(proposalDeal.stage).toBe("proposal");

      // 6. Progress to negotiation
      const negotiationResult = await updateDealStage(context, deal.id, {
        stage: "negotiation",
        probability: 85,
      });
      expect(negotiationResult.isOk()).toBe(true);
      const negotiationDeal = negotiationResult._unsafeUnwrap();
      expect(negotiationDeal.stage).toBe("negotiation");

      // 7. Close the deal
      const closedResult = await updateDealStage(context, deal.id, {
        stage: "closed_won",
        probability: 100,
      });
      expect(closedResult.isOk()).toBe(true);
      const closedDeal = closedResult._unsafeUnwrap();
      expect(closedDeal.stage).toBe("closed_won");
      expect(closedDeal.probability).toBe(100);

      // 8. Verify deal progression maintains data integrity
      expect(closedDeal.id).toBe(deal.id);
      expect(closedDeal.customerId).toBe(customer.id);
      expect(closedDeal.assignedUserId).toBe(user.id);
    });

    it("should handle deal reassignment workflow", async () => {
      // 1. Create initial and new sales reps
      const initialRepInput: CreateUserInput = {
        name: "Initial Rep",
        email: "initial@company.com",
        password: "password123",
        role: "user",
      };
      const initialRepResult = await createUser(context, initialRepInput);
      expect(initialRepResult.isOk()).toBe(true);
      const initialRep = initialRepResult._unsafeUnwrap();

      const newRepInput: CreateUserInput = {
        name: "New Rep",
        email: "new@company.com",
        password: "password123",
        role: "user",
      };
      const newRepResult = await createUser(context, newRepInput);
      expect(newRepResult.isOk()).toBe(true);
      const newRep = newRepResult._unsafeUnwrap();

      // 2. Create customer assigned to initial rep
      const customerInput: CreateCustomerInput = {
        name: "Client Corp",
        assignedUserId: initialRep.id,
      };
      const customerResult = await createCustomer(context, customerInput);
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // 3. Create deal with initial rep
      const dealInput: CreateDealInput = {
        title: "Software License",
        amount: "25000.00",
        customerId: customer.id,
        assignedUserId: initialRep.id,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stage: "qualification",
        probability: 60,
        competitors: [],
      };
      const dealResult = await createDeal(context, dealInput);
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      // 4. Create activity by initial rep
      const activityInput: CreateActivityInput = {
        type: "call",
        subject: "Discovery Call",
        description: "Initial discovery call completed",
        assignedUserId: initialRep.id,
        dealId: deal.id,
        customerId: customer.id,
        scheduledAt: new Date(),
        priority: "medium",
      };
      const activityResult = await createActivity(
        context,
        activityInput,
        initialRep.id,
      );
      expect(activityResult.isOk()).toBe(true);

      // 5. Reassign customer to new rep
      const updatedCustomerResult = await context.customerRepository.update(
        customer.id,
        {
          assignedUserId: newRep.id,
        },
      );
      expect(updatedCustomerResult.isOk()).toBe(true);
      const updatedCustomer = updatedCustomerResult._unsafeUnwrap();
      expect(updatedCustomer.assignedUserId).toBe(newRep.id);

      // 6. Verify deal maintains integrity after customer reassignment
      const dealAfterReassignment = await context.dealRepository.findById(
        deal.id,
      );
      expect(dealAfterReassignment.isOk()).toBe(true);
      const retrievedDeal = dealAfterReassignment._unsafeUnwrap();
      expect(retrievedDeal?.customerId).toBe(customer.id);
      expect(retrievedDeal?.assignedUserId).toBe(initialRep.id); // Deal assignment should remain unchanged
    });
  });

  describe("Activity Management Workflow", () => {
    it("should handle activity completion and follow-up workflow", async () => {
      // 1. Setup: Create user, customer, and deal
      const userInput: CreateUserInput = {
        name: "Sales Rep",
        email: "rep@company.com",
        password: "password123",
        role: "user",
      };
      const userResult = await createUser(context, userInput);
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const customerInput: CreateCustomerInput = {
        name: "Target Corp",
        assignedUserId: user.id,
      };
      const customerResult = await createCustomer(context, customerInput);
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      const dealInput: CreateDealInput = {
        title: "Sales Opportunity",
        amount: "75000.00",
        customerId: customer.id,
        assignedUserId: user.id,
        expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        stage: "qualification",
        probability: 50,
        competitors: [],
      };
      const dealResult = await createDeal(context, dealInput);
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      // 2. Create initial activity
      const initialActivityInput: CreateActivityInput = {
        type: "email",
        subject: "Initial Outreach",
        description: "Sent initial proposal email",
        assignedUserId: user.id,
        dealId: deal.id,
        customerId: customer.id,
        scheduledAt: new Date(),
        priority: "medium",
      };
      const initialActivityResult = await createActivity(
        context,
        initialActivityInput,
        user.id,
      );
      expect(initialActivityResult.isOk()).toBe(true);
      const initialActivity = initialActivityResult._unsafeUnwrap();

      // 3. Complete the initial activity
      const completedActivityResult = await updateActivity(
        context,
        initialActivity.id,
        {
          status: "completed",
          completedAt: new Date(),
          description: "Email sent successfully, awaiting response",
        },
      );
      expect(completedActivityResult.isOk()).toBe(true);
      const completedActivity = completedActivityResult._unsafeUnwrap();
      expect(completedActivity.status).toBe("completed");
      expect(completedActivity.completedAt).toBeDefined();

      // 4. Create follow-up activity
      const followUpActivityInput: CreateActivityInput = {
        type: "call",
        subject: "Follow-up Call",
        description: "Call to discuss proposal and answer questions",
        assignedUserId: user.id,
        dealId: deal.id,
        customerId: customer.id,
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
        priority: "medium",
      };
      const followUpActivityResult = await createActivity(
        context,
        followUpActivityInput,
        user.id,
      );
      expect(followUpActivityResult.isOk()).toBe(true);
      const followUpActivity = followUpActivityResult._unsafeUnwrap();

      // 5. Verify activity chain integrity
      expect(followUpActivity.dealId).toBe(deal.id);
      expect(followUpActivity.customerId).toBe(customer.id);
      expect(followUpActivity.assignedUserId).toBe(user.id);

      // 6. Complete follow-up and progress deal
      const completedFollowUpResult = await updateActivity(
        context,
        followUpActivity.id,
        {
          status: "completed",
          completedAt: new Date(),
          description:
            "Great call, customer is interested. Moving to proposal stage.",
        },
      );
      expect(completedFollowUpResult.isOk()).toBe(true);

      // 7. Progress deal based on activity outcome
      const progressedDealResult = await updateDealStage(context, deal.id, {
        stage: "proposal",
        probability: 70,
      });
      expect(progressedDealResult.isOk()).toBe(true);
      const progressedDeal = progressedDealResult._unsafeUnwrap();
      expect(progressedDeal.stage).toBe("proposal");
      expect(progressedDeal.probability).toBe(70);
    });
  });

  describe("Multi-User Collaboration Workflow", () => {
    it("should handle sales team collaboration on large deal", async () => {
      // 1. Create sales team
      const salesManagerInput: CreateUserInput = {
        name: "Sales Manager",
        email: "manager@company.com",
        password: "password123",
        role: "manager",
      };
      const managerResult = await createUser(context, salesManagerInput);
      expect(managerResult.isOk()).toBe(true);
      const manager = managerResult._unsafeUnwrap();

      const seniorRepInput: CreateUserInput = {
        name: "Senior Rep",
        email: "senior@company.com",
        password: "password123",
        role: "user",
      };
      const seniorRepResult = await createUser(context, seniorRepInput);
      expect(seniorRepResult.isOk()).toBe(true);
      const seniorRep = seniorRepResult._unsafeUnwrap();

      const juniorRepInput: CreateUserInput = {
        name: "Junior Rep",
        email: "junior@company.com",
        password: "password123",
        role: "user",
      };
      const juniorRepResult = await createUser(context, juniorRepInput);
      expect(juniorRepResult.isOk()).toBe(true);
      const juniorRep = juniorRepResult._unsafeUnwrap();

      // 2. Create enterprise customer
      const customerInput: CreateCustomerInput = {
        name: "Enterprise Corp",
        industry: "Finance",
        size: "enterprise",
        assignedUserId: seniorRep.id,
        description: "Large enterprise client requiring team approach",
      };
      const customerResult = await createCustomer(context, customerInput);
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // 3. Create high-value deal
      const dealInput: CreateDealInput = {
        title: "Enterprise Software Suite",
        amount: "500000.00",
        customerId: customer.id,
        assignedUserId: seniorRep.id,
        expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        stage: "qualification",
        probability: 40,
        description: "Large enterprise software implementation",
        competitors: [],
      };
      const dealResult = await createDeal(context, dealInput);
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      // 4. Create activities for different team members
      const managerActivityInput: CreateActivityInput = {
        type: "meeting",
        subject: "Executive Alignment Meeting",
        description: "Meeting with client executives",
        assignedUserId: manager.id,
        dealId: deal.id,
        customerId: customer.id,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        priority: "high",
      };
      const managerActivityResult = await createActivity(
        context,
        managerActivityInput,
        manager.id,
      );
      expect(managerActivityResult.isOk()).toBe(true);

      const seniorRepActivityInput: CreateActivityInput = {
        type: "meeting",
        subject: "Technical Requirements Review",
        description: "Technical deep-dive with client team",
        assignedUserId: seniorRep.id,
        dealId: deal.id,
        customerId: customer.id,
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        priority: "medium",
      };
      const seniorRepActivityResult = await createActivity(
        context,
        seniorRepActivityInput,
        seniorRep.id,
      );
      expect(seniorRepActivityResult.isOk()).toBe(true);

      const juniorRepActivityInput: CreateActivityInput = {
        type: "task",
        subject: "Proposal Preparation",
        description: "Prepare initial proposal draft",
        assignedUserId: juniorRep.id,
        dealId: deal.id,
        customerId: customer.id,
        scheduledAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        priority: "low",
      };
      const juniorRepActivityResult = await createActivity(
        context,
        juniorRepActivityInput,
        juniorRep.id,
      );
      expect(juniorRepActivityResult.isOk()).toBe(true);

      // 5. Verify team collaboration setup
      const managerActivity = managerActivityResult._unsafeUnwrap();
      const seniorRepActivity = seniorRepActivityResult._unsafeUnwrap();
      const juniorRepActivity = juniorRepActivityResult._unsafeUnwrap();

      expect(managerActivity.dealId).toBe(deal.id);
      expect(seniorRepActivity.dealId).toBe(deal.id);
      expect(juniorRepActivity.dealId).toBe(deal.id);

      expect(managerActivity.customerId).toBe(customer.id);
      expect(seniorRepActivity.customerId).toBe(customer.id);
      expect(juniorRepActivity.customerId).toBe(customer.id);

      // 6. Verify primary deal ownership remains with senior rep
      expect(deal.assignedUserId).toBe(seniorRep.id);
      expect(customer.assignedUserId).toBe(seniorRep.id);
    });
  });

  describe("Error Handling in Workflows", () => {
    it("should handle workflow interruption gracefully", async () => {
      // 1. Setup valid workflow components
      const userInput: CreateUserInput = {
        name: "Sales Rep",
        email: "rep@company.com",
        password: "password123",
        role: "user",
      };
      const userResult = await createUser(context, userInput);
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      const customerInput: CreateCustomerInput = {
        name: "Test Customer",
        assignedUserId: user.id,
      };
      const customerResult = await createCustomer(context, customerInput);
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // 2. Create deal with invalid stage transition
      const dealInput: CreateDealInput = {
        title: "Test Deal",
        amount: "10000.00",
        customerId: customer.id,
        assignedUserId: user.id,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stage: "qualification",
        probability: 50,
        competitors: [],
      };
      const dealResult = await createDeal(context, dealInput);
      expect(dealResult.isOk()).toBe(true);
      const deal = dealResult._unsafeUnwrap();

      // 3. Attempt invalid stage transition (skipping stages)
      const invalidStageUpdateResult = await updateDealStage(context, deal.id, {
        stage: "closed_won", // Skipping intermediate stages
        probability: 100,
      });
      // This should still work as the system allows flexible stage transitions
      expect(invalidStageUpdateResult.isOk()).toBe(true);

      // 4. Verify data integrity is maintained
      const updatedDeal = invalidStageUpdateResult._unsafeUnwrap();
      expect(updatedDeal.stage).toBe("closed_won");
      expect(updatedDeal.id).toBe(deal.id);
      expect(updatedDeal.customerId).toBe(customer.id);
    });
  });
});
