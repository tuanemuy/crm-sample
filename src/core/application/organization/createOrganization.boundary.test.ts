import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import { ApplicationError } from "@/lib/error";
import type { CreateOrganizationInput } from "./createOrganization";
import { createOrganization } from "./createOrganization";

let db: Database;
let context: Context;

describe("createOrganization - Boundary Value Tests", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);
  });

  describe("Name Boundary Values", () => {
    it("should create organization with minimum name length (1 character)", async () => {
      const input: CreateOrganizationInput = {
        name: "A",
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.name).toBe("A");
    });

    it("should create organization with maximum name length (200 characters)", async () => {
      const longName = "A".repeat(200);
      const input: CreateOrganizationInput = {
        name: longName,
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.name).toBe(longName);
    });

    it("should reject organization with empty name", async () => {
      const input: CreateOrganizationInput = {
        name: "",
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject organization with name exceeding maximum length (201 characters)", async () => {
      const tooLongName = "A".repeat(201);
      const input: CreateOrganizationInput = {
        name: tooLongName,
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Display Name Boundary Values", () => {
    it("should create organization with maximum display name length (200 characters)", async () => {
      const longDisplayName = "B".repeat(200);
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        displayName: longDisplayName,
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.displayName).toBe(longDisplayName);
    });

    it("should reject organization with display name exceeding maximum length (201 characters)", async () => {
      const tooLongDisplayName = "B".repeat(201);
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        displayName: tooLongDisplayName,
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should create organization without display name", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.displayName).toBeUndefined();
    });
  });

  describe("Description Boundary Values", () => {
    it("should create organization with maximum description length (1000 characters)", async () => {
      const longDescription = "C".repeat(1000);
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        description: longDescription,
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.description).toBe(longDescription);
    });

    it("should reject organization with description exceeding maximum length (1001 characters)", async () => {
      const tooLongDescription = "C".repeat(1001);
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        description: tooLongDescription,
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should create organization without description", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.description).toBeUndefined();
    });
  });

  describe("Founded Year Boundary Values", () => {
    it("should create organization with minimum founded year (1800)", async () => {
      const input: CreateOrganizationInput = {
        name: "Old Organization",
        foundedYear: 1800,
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.foundedYear).toBe(1800);
    });

    it("should create organization with maximum founded year (2100)", async () => {
      const input: CreateOrganizationInput = {
        name: "Future Organization",
        foundedYear: 2100,
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.foundedYear).toBe(2100);
    });

    it("should reject organization with founded year before minimum (1799)", async () => {
      const input: CreateOrganizationInput = {
        name: "Too Old Organization",
        foundedYear: 1799,
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject organization with founded year after maximum (2101)", async () => {
      const input: CreateOrganizationInput = {
        name: "Too Future Organization",
        foundedYear: 2101,
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject organization with non-integer founded year", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        foundedYear: 2023.5,
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should create organization without founded year", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.foundedYear).toBeUndefined();
    });
  });

  describe("Currency Code Boundary Values", () => {
    it("should create organization with valid 3-character currency code", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        currency: "EUR",
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.currency).toBe("EUR");
    });

    it("should reject organization with currency code shorter than 3 characters", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        currency: "US",
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject organization with currency code longer than 3 characters", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        currency: "USDD",
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should use default currency (USD) when not specified", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.currency).toBe("USD");
    });
  });

  describe("Language Code Boundary Values", () => {
    it("should create organization with valid 2-character language code", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        language: "ja",
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.language).toBe("ja");
    });

    it("should reject organization with language code shorter than 2 characters", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        language: "e",
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject organization with language code longer than 2 characters", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        language: "eng",
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should use default language (en) when not specified", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.language).toBe("en");
    });
  });

  describe("Other Field Boundary Values", () => {
    it("should create organization with maximum industry length (100 characters)", async () => {
      const longIndustry = "D".repeat(100);
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        industry: longIndustry,
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.industry).toBe(longIndustry);
    });

    it("should reject organization with industry exceeding maximum length (101 characters)", async () => {
      const tooLongIndustry = "D".repeat(101);
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        industry: tooLongIndustry,
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should create organization with maximum phone length (20 characters)", async () => {
      const longPhone = "1".repeat(20);
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        phone: longPhone,
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.phone).toBe(longPhone);
    });

    it("should reject organization with phone exceeding maximum length (21 characters)", async () => {
      const tooLongPhone = "1".repeat(21);
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        phone: tooLongPhone,
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should create organization with maximum address length (500 characters)", async () => {
      const longAddress = "E".repeat(500);
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        address: longAddress,
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.address).toBe(longAddress);
    });

    it("should reject organization with address exceeding maximum length (501 characters)", async () => {
      const tooLongAddress = "E".repeat(501);
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        address: tooLongAddress,
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Size Enum Boundary Values", () => {
    it("should create organization with all valid size values", async () => {
      const validSizes = ["small", "medium", "large", "enterprise"];

      for (const size of validSizes) {
        const input: CreateOrganizationInput = {
          name: `Test Organization ${size}`,
          size: size as any,
        };

        const result = await createOrganization(context, input);

        expect(result.isOk()).toBe(true);
        const organization = result._unsafeUnwrap();
        expect(organization.size).toBe(size);
      }
    });

    it("should reject organization with invalid size value", async () => {
      const input: CreateOrganizationInput = {
        name: "Test Organization",
        size: "invalid-size" as any,
      };

      const result = await createOrganization(context, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Complex Boundary Combinations", () => {
    it("should create organization with all fields at maximum boundary values", async () => {
      const input: CreateOrganizationInput = {
        name: "A".repeat(200),
        displayName: "B".repeat(200),
        description: "C".repeat(1000),
        industry: "D".repeat(100),
        size: "enterprise",
        foundedYear: 2100,
        website: "https://example.com",
        email: "test@example.com",
        phone: "1".repeat(20),
        address: "E".repeat(500),
        country: "F".repeat(100),
        timezone: "America/New_York",
        currency: "EUR",
        language: "ja",
        logoUrl: "https://example.com/logo.png",
        settings: {
          key1: "value1",
          key2: "value2",
        },
        isActive: true,
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.name).toBe("A".repeat(200));
      expect(organization.displayName).toBe("B".repeat(200));
      expect(organization.description).toBe("C".repeat(1000));
      expect(organization.industry).toBe("D".repeat(100));
      expect(organization.size).toBe("enterprise");
      expect(organization.foundedYear).toBe(2100);
      expect(organization.phone).toBe("1".repeat(20));
      expect(organization.address).toBe("E".repeat(500));
      expect(organization.currency).toBe("EUR");
      expect(organization.language).toBe("ja");
    });

    it("should create organization with minimum required fields only", async () => {
      const input: CreateOrganizationInput = {
        name: "A",
      };

      const result = await createOrganization(context, input);

      expect(result.isOk()).toBe(true);
      const organization = result._unsafeUnwrap();
      expect(organization.name).toBe("A");
      expect(organization.currency).toBe("USD");
      expect(organization.language).toBe("en");
      expect(organization.timezone).toBe("UTC");
      expect(organization.isActive).toBe(true);
    });
  });
});
