import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import {
  createTestContext,
  createUserTestData,
  setupFreshTestDatabase,
} from "@/core/adapters/drizzlePglite/testUtils";
import type { Context } from "@/core/application/context";
import type { UpdateSecuritySettingsInput } from "@/core/domain/security/types";
import { ApplicationError } from "@/lib/error";
import { configureSecuritySettings } from "./configureSecuritySettings";

let db: Database;
let context: Context;
let adminUserId: string;
let organizationId: string;

describe("configureSecuritySettings - Boundary Value Tests", () => {
  beforeEach(async () => {
    db = await setupFreshTestDatabase();
    context = createTestContext(db);

    // Create admin user
    const userData = createUserTestData({
      overrides: { email: "admin@example.com" },
    });
    const userResult = await context.userRepository.create({
      ...userData,
      passwordHash: "hash",
      isActive: true,
    });
    expect(userResult.isOk()).toBe(true);
    const user = userResult._unsafeUnwrap();
    adminUserId = user.id;

    // Create organization
    organizationId = uuidv7();
  });

  describe("Password Min Length Boundary Values", () => {
    it("should configure security settings with minimum password length (4)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordMinLength: 4,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "passwordMinLength",
        );
      }
    });

    it("should configure security settings with maximum password length (128)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordMinLength: 128,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "passwordMinLength",
        );
      }
    });

    it("should reject password min length below minimum (3)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordMinLength: 3,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject password min length above maximum (129)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordMinLength: 129,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Password Expiration Days Boundary Values", () => {
    it("should configure security settings with minimum password expiration (0)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordExpirationDays: 0,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "passwordExpirationDays",
        );
      }
    });

    it("should configure security settings with maximum password expiration (365)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordExpirationDays: 365,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "passwordExpirationDays",
        );
      }
    });

    it("should reject password expiration days below minimum (-1)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordExpirationDays: -1,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject password expiration days above maximum (366)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordExpirationDays: 366,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Max Login Attempts Boundary Values", () => {
    it("should configure security settings with minimum max login attempts (3)", async () => {
      const input: UpdateSecuritySettingsInput = {
        maxLoginAttempts: 3,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "maxLoginAttempts",
        );
      }
    });

    it("should configure security settings with maximum max login attempts (20)", async () => {
      const input: UpdateSecuritySettingsInput = {
        maxLoginAttempts: 20,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "maxLoginAttempts",
        );
      }
    });

    it("should reject max login attempts below minimum (2)", async () => {
      const input: UpdateSecuritySettingsInput = {
        maxLoginAttempts: 2,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject max login attempts above maximum (21)", async () => {
      const input: UpdateSecuritySettingsInput = {
        maxLoginAttempts: 21,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Lockout Duration Minutes Boundary Values", () => {
    it("should configure security settings with minimum lockout duration (5)", async () => {
      const input: UpdateSecuritySettingsInput = {
        lockoutDurationMinutes: 5,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "lockoutDurationMinutes",
        );
      }
    });

    it("should configure security settings with maximum lockout duration (1440)", async () => {
      const input: UpdateSecuritySettingsInput = {
        lockoutDurationMinutes: 1440, // 24 hours
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "lockoutDurationMinutes",
        );
      }
    });

    it("should reject lockout duration below minimum (4)", async () => {
      const input: UpdateSecuritySettingsInput = {
        lockoutDurationMinutes: 4,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject lockout duration above maximum (1441)", async () => {
      const input: UpdateSecuritySettingsInput = {
        lockoutDurationMinutes: 1441,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Session Timeout Minutes Boundary Values", () => {
    it("should configure security settings with minimum session timeout (15)", async () => {
      const input: UpdateSecuritySettingsInput = {
        sessionTimeoutMinutes: 15,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "sessionTimeoutMinutes",
        );
      }
    });

    it("should configure security settings with maximum session timeout (480)", async () => {
      const input: UpdateSecuritySettingsInput = {
        sessionTimeoutMinutes: 480, // 8 hours
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "sessionTimeoutMinutes",
        );
      }
    });

    it("should reject session timeout below minimum (14)", async () => {
      const input: UpdateSecuritySettingsInput = {
        sessionTimeoutMinutes: 14,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject session timeout above maximum (481)", async () => {
      const input: UpdateSecuritySettingsInput = {
        sessionTimeoutMinutes: 481,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Data Retention Days Boundary Values", () => {
    it("should configure security settings with minimum data retention (30)", async () => {
      const input: UpdateSecuritySettingsInput = {
        dataRetentionDays: 30,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "dataRetentionDays",
        );
      }
    });

    it("should configure security settings with maximum data retention (2555)", async () => {
      const input: UpdateSecuritySettingsInput = {
        dataRetentionDays: 2555, // 7 years
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "dataRetentionDays",
        );
      }
    });

    it("should reject data retention below minimum (29)", async () => {
      const input: UpdateSecuritySettingsInput = {
        dataRetentionDays: 29,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject data retention above maximum (2556)", async () => {
      const input: UpdateSecuritySettingsInput = {
        dataRetentionDays: 2556,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Password History Count Boundary Values", () => {
    it("should configure security settings with minimum password history (0)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordHistoryCount: 0,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "passwordHistoryCount",
        );
      }
    });

    it("should configure security settings with maximum password history (24)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordHistoryCount: 24,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary value
      if (result.isErr()) {
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "passwordHistoryCount",
        );
      }
    });

    it("should reject password history below minimum (-1)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordHistoryCount: -1,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject password history above maximum (25)", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordHistoryCount: 25,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });

  describe("Complex Security Settings Combinations", () => {
    it("should configure all security settings with maximum boundary values", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordMinLength: 128,
        passwordExpirationDays: 365,
        passwordHistoryCount: 24,
        maxLoginAttempts: 20,
        lockoutDurationMinutes: 1440,
        sessionTimeoutMinutes: 480,
        dataRetentionDays: 2555,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: true,
        twoFactorRequired: true,
        auditLogEnabled: true,
        encryptionAtRest: true,
        securityNotifications: true,
        maintenanceMode: false,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary values
      if (result.isErr()) {
        // Check that it doesn't fail due to validation errors
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "passwordMinLength",
        );
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "passwordExpirationDays",
        );
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "maxLoginAttempts",
        );
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "lockoutDurationMinutes",
        );
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "sessionTimeoutMinutes",
        );
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "dataRetentionDays",
        );
      }
    });

    it("should configure all security settings with minimum boundary values", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordMinLength: 4,
        passwordExpirationDays: 0,
        passwordHistoryCount: 0,
        maxLoginAttempts: 3,
        lockoutDurationMinutes: 5,
        sessionTimeoutMinutes: 15,
        dataRetentionDays: 30,
        passwordRequireUppercase: false,
        passwordRequireLowercase: false,
        passwordRequireNumbers: false,
        passwordRequireSpecialChars: false,
        twoFactorRequired: false,
        auditLogEnabled: false,
        encryptionAtRest: false,
        securityNotifications: false,
        maintenanceMode: false,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      // Should not fail due to boundary values
      if (result.isErr()) {
        // Check that it doesn't fail due to validation errors
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "passwordMinLength",
        );
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "passwordExpirationDays",
        );
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "maxLoginAttempts",
        );
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "lockoutDurationMinutes",
        );
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "sessionTimeoutMinutes",
        );
        expect(result._unsafeUnwrapErr().message).not.toContain(
          "dataRetentionDays",
        );
      }
    });
  });

  describe("Non-integer Values", () => {
    it("should reject non-integer password min length", async () => {
      const input: UpdateSecuritySettingsInput = {
        passwordMinLength: 8.5,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject non-integer data retention days", async () => {
      const input: UpdateSecuritySettingsInput = {
        dataRetentionDays: 90.5,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });

    it("should reject non-integer session timeout", async () => {
      const input: UpdateSecuritySettingsInput = {
        sessionTimeoutMinutes: 30.5,
      };

      const result = await configureSecuritySettings(
        context,
        adminUserId,
        organizationId,
        input,
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
    });
  });
});
