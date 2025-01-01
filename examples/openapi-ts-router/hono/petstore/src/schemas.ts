import * as z from 'zod';

export const CategorySchema = z.object({
	id: z.number().int().optional(),
	name: z.string().optional()
});

export const TagSchema = z.object({
	id: z.number().int().optional(),
	name: z.string().optional()
});

export const PetSchema = z.object({
	id: z.number().int().optional(),
	name: z.string(),
	category: CategorySchema.optional(),
	photoUrls: z.array(z.string()),
	tags: z.array(TagSchema).optional(),
	status: z.enum(['available', 'pending', 'sold']).optional()
});
