export class AnyError extends Error {
  override readonly name: string = "AnyError";
  override readonly cause?: AnyError | Error;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = isError(cause) ? cause : undefined;
  }
}

export function isError(error: unknown): error is AnyError | Error {
  return error instanceof Error || error instanceof AnyError;
}

export function fromUnknown(error: unknown): AnyError {
  if (error instanceof Error) {
    if (error instanceof AnyError) {
      return error;
    }

    return new AnyError(error.message, error);
  }

  if (typeof error === "string") {
    return new AnyError(error);
  }

  return new AnyError("Unknown error occurred", error);
}

// Repository error for database operations
export class RepositoryError extends AnyError {
  override readonly name = "RepositoryError";
}

// Application error for business logic operations
export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

// Validation error for input validation
export class ValidationError extends AnyError {
  override readonly name = "ValidationError";
}

// Authorization error for permission checks
export class AuthorizationError extends AnyError {
  override readonly name = "AuthorizationError";
}

// Not found error for missing resources
export class NotFoundError extends AnyError {
  override readonly name = "NotFoundError";
}

// Conflict error for duplicate resources
export class ConflictError extends AnyError {
  override readonly name = "ConflictError";
}
