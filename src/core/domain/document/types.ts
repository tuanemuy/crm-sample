import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Document entity schema
export const documentSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  size: z.number().int().positive(),
  url: z.string().url(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  entityType: z.enum([
    "customer",
    "contact",
    "deal",
    "lead",
    "activity",
    "general",
  ]),
  entityId: z.string().uuid().optional(),
  uploadedBy: z.string().uuid(),
  isPublic: z.boolean().default(false),
  version: z.number().int().default(1),
  parentDocumentId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Document = z.infer<typeof documentSchema>;

// Document creation input schema
export const createDocumentInputSchema = z.object({
  filename: z.string().min(1).max(255),
  originalFilename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  url: z.string().url(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  entityType: z.enum([
    "customer",
    "contact",
    "deal",
    "lead",
    "activity",
    "general",
  ]),
  entityId: z.string().uuid().optional(),
  isPublic: z.boolean().default(false),
  parentDocumentId: z.string().uuid().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;

// Document update input schema
export const updateDocumentInputSchema = z.object({
  originalFilename: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  entityType: z
    .enum(["customer", "contact", "deal", "lead", "activity", "general"])
    .optional(),
  entityId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentInputSchema>;

// Document search/filter query schema
export const documentFilterSchema = z.object({
  keyword: z.string().optional(),
  mimeType: z.string().optional(),
  entityType: z
    .enum(["customer", "contact", "deal", "lead", "activity", "general"])
    .optional(),
  entityId: z.string().uuid().optional(),
  uploadedBy: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  sizeMin: z.number().int().optional(),
  sizeMax: z.number().int().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type DocumentFilter = z.infer<typeof documentFilterSchema>;

// Document list query schema
export const listDocumentsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: documentFilterSchema.optional(),
  sortBy: z.enum(["filename", "size", "createdAt", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;

// Document repository params
export const createDocumentParamsSchema = z.object({
  filename: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  url: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  entityType: z.enum([
    "customer",
    "contact",
    "deal",
    "lead",
    "activity",
    "general",
  ]),
  entityId: z.string().uuid().optional(),
  uploadedBy: z.string().uuid(),
  isPublic: z.boolean().default(false),
  parentDocumentId: z.string().uuid().optional(),
});

export type CreateDocumentParams = z.infer<typeof createDocumentParamsSchema>;

export const updateDocumentParamsSchema = z.object({
  originalFilename: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  entityType: z
    .enum(["customer", "contact", "deal", "lead", "activity", "general"])
    .optional(),
  entityId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateDocumentParams = z.infer<typeof updateDocumentParamsSchema>;

// Document with related data
export const documentWithRelationsSchema = documentSchema.extend({
  uploadedByUser: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
  entity: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      type: z.enum([
        "customer",
        "contact",
        "deal",
        "lead",
        "activity",
        "general",
      ]),
    })
    .optional(),
  parentDocument: z
    .object({
      id: z.string().uuid(),
      filename: z.string(),
      originalFilename: z.string(),
    })
    .optional(),
  versions: z
    .array(
      z.object({
        id: z.string().uuid(),
        filename: z.string(),
        version: z.number().int(),
        createdAt: z.date(),
      }),
    )
    .optional(),
});

export type DocumentWithRelations = z.infer<typeof documentWithRelationsSchema>;

// Document statistics
export const documentStatsSchema = z.object({
  totalDocuments: z.number(),
  totalSize: z.number(),
  documentsByType: z.record(z.string(), z.number()),
  documentsByEntity: z.record(z.string(), z.number()),
  recentDocuments: z.array(documentSchema),
  popularTags: z.array(
    z.object({
      tag: z.string(),
      count: z.number(),
    }),
  ),
});

export type DocumentStats = z.infer<typeof documentStatsSchema>;

// File upload schemas
export const uploadFileInputSchema = z.object({
  file: z.any(), // File object from form data
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  entityType: z.enum([
    "customer",
    "contact",
    "deal",
    "lead",
    "activity",
    "general",
  ]),
  entityId: z.string().uuid().optional(),
  isPublic: z.boolean().default(false),
});

export type UploadFileInput = z.infer<typeof uploadFileInputSchema>;

export const uploadFileParamsSchema = z.object({
  buffer: z.any(), // Buffer
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
});

export type UploadFileParams = z.infer<typeof uploadFileParamsSchema>;

export const uploadFileResultSchema = z.object({
  url: z.string().url(),
  filename: z.string(),
});

export type UploadFileResult = z.infer<typeof uploadFileResultSchema>;
