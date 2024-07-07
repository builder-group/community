import { Router } from 'express';
import * as v from 'valibot';
import { valibotAdapter } from 'validation-adapters/valibot';
import { describe, it } from 'vitest';

import { createExpressOpenApiRouter } from '../features';
import { paths } from './resources/mock-openapi-types';

describe('playground', () => {
	it('types should work', async () => {
		const openapiRouter = createExpressOpenApiRouter<paths>(Router());

		const pathValibotAdapter = valibotAdapter(v.object({}));

		openapiRouter.get(
			'/pet/{petId}',
			{
				// pathAdapter: createValidationAdapter([
				// 	{
				// 		key: 'pet',
				// 		validate: (cx) => {
				// 			// TODO
				// 		}
				// 	}
				// ])
				pathAdapter: pathValibotAdapter
			},
			async (req, res, next) => {
				// TODO
			}
		);
	});
});
