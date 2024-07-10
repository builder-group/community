import { Router } from 'express';
import * as v from 'valibot';
import { vValidator } from 'validation-adapters/valibot';
import { describe, it } from 'vitest';

import { createExpressOpenApiRouter } from '../features';
import { TOpenApiRouter } from '../types';
import { paths } from './resources/mock-openapi-types';

describe('playground', () => {
	it('types should work', async () => {
		const expressOpenApiRouter = createExpressOpenApiRouter<paths>(Router());
		const honoOpenApiRouter: TOpenApiRouter<['base', 'hono'], paths> = null as any;

		honoOpenApiRouter.get('/pet/{petId}', {
			pathValidator: vValidator(
				v.object({
					petId: v.number()
				})
			),
			handler: (c) => {
				// c.req.valid('')
				// TODO
				// return c.json()

				return c.json({ name: '', photoUrls: [] });
			}
		});

		expressOpenApiRouter.get('/pet/{petId}', {
			pathValidator: vValidator(
				v.object({
					petId: v.number()
				})
			),
			handler: async (req, res, next) => {
				// TODO
			}
		});

		expressOpenApiRouter.get('/pet/findByTags', {
			queryValidator: vValidator(
				v.object({
					tags: v.optional(v.array(v.string()))
				})
			),
			handler: (req, res, next) => {}
		});
	});
});
