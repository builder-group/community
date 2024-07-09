import { Router } from 'express';
import * as v from 'valibot';
import { vValidator } from 'validation-adapters/valibot';
import { describe, it } from 'vitest';

import { createExpressOpenApiRouter } from '../features';
import { paths } from './resources/mock-openapi-types';

describe('playground', () => {
	it('types should work', async () => {
		const openapiRouter = createExpressOpenApiRouter<paths>(Router());

		openapiRouter.get('/pet/{petId}', {
			pathValidator: vValidator(
				v.object({
					petId: v.number()
				})
			),
			handler: async (req, res, next) => {
				// TODO
			}
		});

		openapiRouter.get('/pet/findByTags', {
			queryValidator: vValidator(
				v.object({
					tags: v.optional(v.array(v.string()))
				})
			),
			handler: (req, res, next) => {}
		});
	});
});
