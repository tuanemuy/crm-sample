import bcrypt from "bcryptjs";
import { err, ok } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/core/application/context";
import type {
  CreateUserInput,
  User,
  UserWithoutPassword,
} from "@/core/domain/user/types";
import { ApplicationError, RepositoryError } from "@/lib/error";
import { createUser } from "./createUser";

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

// biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
const mockBcryptHash = bcrypt.hash as any;

// Mock repositories
const mockUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findActiveUsers: vi.fn(),
  findByRole: vi.fn(),
  getProfile: vi.fn(),
  search: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  updateLastLogin: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(),
};

// Mock context with minimal required repositories
const mockContext: Context = {
  userRepository: mockUserRepository,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  customerRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  contactRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  contactHistoryRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  leadRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  dealRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  activityRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  notificationRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  organizationRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  permissionRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  proposalRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  reportRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  scoringRuleRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  scoringService: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  documentRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  storageManager: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  campaignRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  emailMarketingRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  approvalRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  securityRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  displaySettingsRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  dashboardRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  integrationRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  integrationService: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  importExportRepository: {} as any,
  // biome-ignore lint/suspicious/noExplicitAny: Mock implementation for testing
  importExportService: {} as any,
};

describe("createUser", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe("existing user validation", () => {
    it("should reject creation if user with same email already exists", async () => {
      const input: CreateUserInput = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "user",
      };

      const existingUser: User = {
        id: uuidv7(),
        name: "Existing User",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(existingUser));

      const result = await createUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toBe(
        "User with this email already exists",
      );
    });

    it("should handle repository error when checking existing user", async () => {
      const input: CreateUserInput = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "user",
      };

      mockUserRepository.findByEmail.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to check existing user",
      );
    });
  });

  describe("password hashing", () => {
    it("should hash password before creating user", async () => {
      const input: CreateUserInput = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "user",
      };

      const hashedPassword = "hashedpassword123";
      const createdUser: User = {
        id: uuidv7(),
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(ok(createdUser));

      const result = await createUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: "john@example.com",
        name: "John Doe",
        passwordHash: hashedPassword,
        role: "user",
        isActive: true,
      });
    });

    it("should handle bcrypt error during password hashing", async () => {
      const input: CreateUserInput = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "user",
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockRejectedValue(new Error("Bcrypt error"));

      await expect(createUser(mockContext, input)).rejects.toThrow(
        "Bcrypt error",
      );
    });
  });

  describe("user creation", () => {
    it("should handle repository error during user creation", async () => {
      const input: CreateUserInput = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "user",
      };

      const hashedPassword = "hashedpassword123";

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(
        err(new RepositoryError("Database error")),
      );

      const result = await createUser(mockContext, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError);
      expect(result._unsafeUnwrapErr().message).toContain(
        "Failed to create user",
      );
    });
  });

  describe("successful creation", () => {
    it("should create user with user role", async () => {
      const input: CreateUserInput = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "user",
      };

      const hashedPassword = "hashedpassword123";
      const createdUser: User = {
        id: uuidv7(),
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUserWithoutPassword: UserWithoutPassword = {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(ok(createdUser));

      const result = await createUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedUserWithoutPassword);
      expect(result._unsafeUnwrap()).not.toHaveProperty("passwordHash");
    });

    it("should create user with manager role", async () => {
      const input: CreateUserInput = {
        name: "Jane Manager",
        email: "jane@example.com",
        password: "securepassword",
        role: "manager",
      };

      const hashedPassword = "hashedpassword456";
      const createdUser: User = {
        id: uuidv7(),
        name: "Jane Manager",
        email: "jane@example.com",
        role: "manager",
        isActive: true,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUserWithoutPassword: UserWithoutPassword = {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(ok(createdUser));

      const result = await createUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedUserWithoutPassword);
    });

    it("should create user with admin role", async () => {
      const input: CreateUserInput = {
        name: "Admin User",
        email: "admin@example.com",
        password: "adminpassword",
        role: "admin",
      };

      const hashedPassword = "hashedpassword789";
      const createdUser: User = {
        id: uuidv7(),
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        isActive: true,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUserWithoutPassword: UserWithoutPassword = {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(ok(createdUser));

      const result = await createUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedUserWithoutPassword);
    });
  });

  describe("edge cases", () => {
    it("should handle user created with empty previous lastLoginAt", async () => {
      const input: CreateUserInput = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "user",
      };

      const hashedPassword = "hashedpassword123";
      const createdUser: User = {
        id: uuidv7(),
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
        lastLoginAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUserWithoutPassword: UserWithoutPassword = {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        isActive: createdUser.isActive,
        lastLoginAt: undefined,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(ok(createdUser));

      const result = await createUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedUserWithoutPassword);
      expect(result._unsafeUnwrap().lastLoginAt).toBeUndefined();
    });

    it("should handle email case sensitivity", async () => {
      const input: CreateUserInput = {
        name: "John Doe",
        email: "John@Example.COM",
        password: "password123",
        role: "user",
      };

      const hashedPassword = "hashedpassword123";
      const createdUser: User = {
        id: uuidv7(),
        name: "John Doe",
        email: "John@Example.COM",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(ok(createdUser));

      const result = await createUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        "John@Example.COM",
      );
    });

    it("should set isActive to true by default", async () => {
      const input: CreateUserInput = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "user",
      };

      const hashedPassword = "hashedpassword123";
      const createdUser: User = {
        id: uuidv7(),
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(ok(createdUser));

      const result = await createUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: "john@example.com",
        name: "John Doe",
        passwordHash: hashedPassword,
        role: "user",
        isActive: true,
      });
    });

    it("should handle minimum length name", async () => {
      const input: CreateUserInput = {
        name: "A",
        email: "a@example.com",
        password: "password123",
        role: "user",
      };

      const hashedPassword = "hashedpassword123";
      const createdUser: User = {
        id: uuidv7(),
        name: "A",
        email: "a@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(ok(createdUser));

      const result = await createUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().name).toBe("A");
    });

    it("should handle complex password with special characters", async () => {
      const input: CreateUserInput = {
        name: "John Doe",
        email: "john@example.com",
        password: "P@ssw0rd!@#$%^&*()",
        role: "user",
      };

      const hashedPassword = "complex_hashed_password";
      const createdUser: User = {
        id: uuidv7(),
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        isActive: true,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(ok(null));
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(ok(createdUser));

      const result = await createUser(mockContext, input);

      expect(result.isOk()).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith("P@ssw0rd!@#$%^&*()", 10);
    });
  });
});
