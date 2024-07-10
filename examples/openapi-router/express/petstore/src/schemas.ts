import * as v from 'valibot';

export const CategorySchema = v.object({
	id: v.optional(v.number()),
	name: v.optional(v.string())
});

export const TagSchema = v.object({
	id: v.optional(v.number()),
	name: v.optional(v.string())
});

export const PetSchema = v.object({
	id: v.optional(v.number()),
	name: v.string(),
	category: v.optional(CategorySchema),
	photoUrls: v.array(v.string()),
	tags: v.optional(v.array(TagSchema)),
	status: v.optional(v.picklist(['available', 'pending', 'sold']))
});
