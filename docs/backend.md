# Backend Implementation

### Types example

```typescript
// src/core/domain/post/types.ts

import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

export const postSchema = z.object({
  id: z.uuid(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Post = z.infer<typeof postSchema>;

// ...

export const listPostQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      keyword: z.string().optional(),
    })
    .optional(),
});
export type ListPostQuery = z.infer<typeof listPostQuerySchema>;
```

### Ports example

```typescript
// src/core/domain/post/ports/postRepository.ts

export interface PostRepository {
  create(post: CreatePostParams): Promise<Result<Post, RepositoryError>>;
  list(query: ListPostQuery): Promise<Result<Post, RepositoryError>>;
  // Other repository methods...
}
```

```typescript
// src/core/domain/file/ports/storageManager.ts

export interface StorageManager {
  uploadFile(file: UploadFileParams): Promise<Result<File, StorageError>>;
  // Other session management methods...
}
```

### Adapters example

```typescript
// src/core/adapters/drizzlePglite/postRepository.ts

import type { Result } from "neverthrow";
import type { PostRepository } from "@/core/domain/post/ports/postRepository";
import { type CreatePostParams, type ListPostQuery, type Post, postSchema, } from "@/core/domain/post/types";
import type { Database } from "./database";

export class DrizzlePglitePostRepository implements PostRepository {
  constructor(private readonly db: Database) {}

  async create(params: CreatePostParams): Promise<Result<Post, RepositoryError>> {
    try {
      const result = await this.db
        .insert(posts)
        .values(params)
        .returning();

      const post = result[0];
      if (!post) {
        return err(new RepositoryError("Failed to create task"));
      }

      return validate(postSchema, post).mapErr((error) => {
        return new RepositoryError("Invalid post data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create task", error));
    }
  }

  async list(query: ListPostQuery): Promise<Result<{ items: Post[], count: number }, RepositoryError>> {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.keyword ? like(posts.content, `%${filter.keyword}%`) : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(posts)
          .where(and(...filters))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(posts)
          .where(and(...filters)),
      ]);

      return ok({
        items: items
          .map((item) => validate(postSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0].count),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list posts", error));
    }
  }
}
```

### Database schema example

```typescript
// src/core/adapters/drizzlePglite/schema.ts

import { v7 as uuidv7 } from "uuid";

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    // Other fields...
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
);
```

### Application Service example

```typescript
// src/core/application/post/createPost.ts

import { z } from "zod/v4";
import { Result } from "neverthrow";
import type { PostRepository } from "@/core/domain/post/ports/postRepository";
import type { Context } from "@/core/context";

export const createPostInputSchema = z.object({
  content: z.string().min(1).max(500),
});
export type CreatePostInput = z.infer<typeof createPostInputSchema>;

export async function createPost(
  context: Context,
  input: CreatePostInput
): Promise<Result<Post, RepositoryError>> {
  return context.postRepository.create({
    content: input.content
  }).mapErr((error) => {
    return new ApplicationError("Failed to create post", error);
  });
}
```

### Context object example

```typescript
// Context object for specific environment
// ex: src/core/context.ts

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  // Other environment variables...
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.safeParse(process.env);
if (!env.success) {
  throw new Error(/* Zod errors */);
}

const db = getDatabase(env.data.DATABASE_URL);

export const context = {
  userRepository: new DrizzlePgliteUserRepository(db),
  storageManager: new S3StorageManager({
    bucketName: process.env.S3_BUCKET_NAME,
    region: process.env.S3_REGION,
    // Other S3 configurations...
  }),
  // Ohter adapters...
};
```
