import { z } from 'zod';

export const SGreetQuery = z.object({
	name: z.string().trim().min(1).default('Builder')
});
