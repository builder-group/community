import { Router } from 'express';
import { describe, it } from 'vitest';
import { createOpenApiRouter } from '../create-openapi-router';
import { paths } from './resources/mock-openapi-types';

describe('playground', () => {
	it('types should work', async () => {
		const apiRouter = createOpenApiRouter<paths>(Router());

		apiRouter.get('/pet/{petId}');

		// TODO
	});
});
