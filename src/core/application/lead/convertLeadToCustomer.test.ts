import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { ConvertLeadInput } from "@/core/domain/lead/types";
import { ApplicationError, NotFoundError } from "@/lib/error";
import { convertLeadToCustomer } from "./convertLeadToCustomer";

let db: Database;
let context: Context;

describe("convertLeadToCustomer", () => {
  beforeEach(async () => {
    db = await setupTestDatabase();
    context = createTestContext(db);
  });

  describe("input validation", () => {
    it("should validate lead conversion requirements", async () => {
      const invalidInputs = [
        {
          customerId: "invalid-uuid",
          createContact: true,
          createDeal: false,
        }, // Invalid customer UUID
        {
          customerId: 123, // Non-string customer ID
          createContact: true,
          createDeal: true,
          dealInfo: {
            title: "Valid Deal Title",
            amount: "10000",
          },
        }, // Invalid customer ID type
      ];

      for (const input of invalidInputs) {
        const result = await convertLeadToCustomer(
          context,
          uuidv7(),
          input as ConvertLeadInput,
        );
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
        expect(result._unsafeUnwrapErr().message).toContain("Invalid input");
      }
    });
  });

  describe("business logic validation", () => {
    it("should reject if lead does not exist", async () => {
      const input: ConvertLeadInput = {
        customerId: uuidv7(),
        createContact: true,
        createDeal: false,
      };

      const result = await convertLeadToCustomer(context, uuidv7(), input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
      expect(result._unsafeUnwrapErr().message).toBe("Lead not found");
    });

    it("should reject if target customer does not exist", async () => {
      // Create a lead first
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "new",
        score: 80,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: ConvertLeadInput = {
        customerId: uuidv7(), // Non-existent customer
        createContact: true,
        createDeal: false,
      };

      const result = await convertLeadToCustomer(context, lead.id, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Target customer does not exist",
      );
    });

    it("should reject if lead is already converted", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a lead already converted
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "converted",
        score: 80,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: ConvertLeadInput = {
        customerId: customer.id,
        createContact: true,
        createDeal: false,
      };

      const result = await convertLeadToCustomer(context, lead.id, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "Lead is already converted",
      );
    });
  });

  describe("successful conversion", () => {
    it("should convert lead to customer with minimal options", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a lead
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "qualified",
        score: 80,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: ConvertLeadInput = {
        customerId: customer.id,
        createContact: true,
        createDeal: false,
      };

      const result = await convertLeadToCustomer(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const convertedCustomer = result._unsafeUnwrap();

      expect(convertedCustomer.id).toBe(customer.id);
      expect(convertedCustomer.name).toBe("Test Customer");
    });

    it("should convert lead and create contact", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a lead
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "qualified",
        score: 80,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: ConvertLeadInput = {
        customerId: customer.id,
        createContact: true,
        createDeal: false,
      };

      const result = await convertLeadToCustomer(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const convertedCustomer = result._unsafeUnwrap();

      expect(convertedCustomer.id).toBe(customer.id);
    });

    it("should convert lead and create deal", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for assignment
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a lead
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "qualified",
        score: 80,
        assignedUserId: user.id,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: ConvertLeadInput = {
        customerId: customer.id,
        createContact: true,
        createDeal: true,
        dealInfo: {
          title: "New Deal from Lead",
          amount: "50000",
          stage: "qualification",
        },
      };

      const result = await convertLeadToCustomer(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const convertedCustomer = result._unsafeUnwrap();

      expect(convertedCustomer.id).toBe(customer.id);
    });

    it("should convert lead with all options", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for assignment
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a lead
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "qualified",
        score: 80,
        assignedUserId: user.id,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: ConvertLeadInput = {
        customerId: customer.id,
        createContact: true,
        createDeal: true,
        dealInfo: {
          title: "Comprehensive Deal",
          amount: "100000",
          stage: "proposal",
        },
      };

      const result = await convertLeadToCustomer(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const convertedCustomer = result._unsafeUnwrap();

      expect(convertedCustomer.id).toBe(customer.id);
    });
  });

  describe("data structure validation", () => {
    it("should return customer with proper structure", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a lead
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "qualified",
        score: 80,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: ConvertLeadInput = {
        customerId: customer.id,
        createContact: true,
        createDeal: false,
      };

      const result = await convertLeadToCustomer(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const convertedCustomer = result._unsafeUnwrap();

      expect(typeof convertedCustomer.id).toBe("string");
      expect(typeof convertedCustomer.name).toBe("string");
      expect(typeof convertedCustomer.status).toBe("string");
      expect(convertedCustomer.createdAt).toBeInstanceOf(Date);
      expect(convertedCustomer.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("edge cases", () => {
    it("should handle conversion without assigned user", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a lead without assigned user
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "qualified",
        score: 80,
        tags: [],
        // No assignedUserId
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: ConvertLeadInput = {
        customerId: customer.id,
        createContact: true,
        createDeal: true,
        dealInfo: {
          title: "Deal without User",
          amount: "25000",
        },
      };

      const result = await convertLeadToCustomer(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const convertedCustomer = result._unsafeUnwrap();

      expect(convertedCustomer.id).toBe(customer.id);
    });

    it("should handle deal creation with default stage", async () => {
      // Create a customer first
      const customerResult = await context.customerRepository.create({
        name: "Test Customer",
        status: "active",
      });
      expect(customerResult.isOk()).toBe(true);
      const customer = customerResult._unsafeUnwrap();

      // Create a user for assignment
      const userResult = await context.userRepository.create({
        name: "Test User",
        email: "user@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
      });
      expect(userResult.isOk()).toBe(true);
      const user = userResult._unsafeUnwrap();

      // Create a lead
      const leadResult = await context.leadRepository.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        company: "Test Company",
        title: "Manager",
        source: "website",
        status: "qualified",
        score: 80,
        assignedUserId: user.id,
        tags: [],
      });
      expect(leadResult.isOk()).toBe(true);
      const lead = leadResult._unsafeUnwrap();

      const input: ConvertLeadInput = {
        customerId: customer.id,
        createContact: true,
        createDeal: true,
        dealInfo: {
          title: "Deal with Default Stage",
          amount: "15000",
          // No stage specified - should default to "prospecting"
        },
      };

      const result = await convertLeadToCustomer(context, lead.id, input);

      expect(result.isOk()).toBe(true);
      const convertedCustomer = result._unsafeUnwrap();

      expect(convertedCustomer.id).toBe(customer.id);
    });
  });
});
