import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().min(3).max(100),
    proteins: z.preprocess(val => Number(val), z.number().min(0).max(999)).optional().default(0),
    carbs: z.preprocess(val => Number(val), z.number().min(0).max(999)).optional().default(0),
    sugar: z.preprocess(val => Number(val), z.number().min(0).max(999)).optional().default(0),
    fats: z.preprocess(val => Number(val), z.number().min(0).max(999)).optional().default(0),
    fiber: z.preprocess(val => Number(val), z.number().min(0).max(999)).optional().default(0),
    sodium: z.preprocess(val => Number(val), z.number().min(0).max(999)).optional().default(0),
    ethanol: z.preprocess(val => Number(val), z.number().min(0).max(999)).optional().default(0),
    barcode: z.string().max(10000).optional(),
    isExpectingCheck: z.boolean().default(false),
})

export type CreateProductSchema = z.infer<typeof createProductSchema>