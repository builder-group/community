import { describe, expect, it } from 'vitest';
import { createGraphQLFetchClient, createOpenApiFetchClient, withGraphQLCache } from '../features';
import { paths } from './resources/mock-openapi-types';

describe('playground', () => {
	it('types should work', async () => {
		const fetchClient = createOpenApiFetchClient<paths>();

		const getPetByIdResult = await fetchClient.get('/pet/{petId}', {
			pathParams: {
				petId: 10
			},
			pathSerializer: (path, params) => {
				return path;
			},
			querySerializer: (query) => {
				return query.toString();
			},
			bodySerializer: (body) => {
				return JSON.stringify(body);
			},
			parseAs: 'json'
		});

		getPetByIdResult.unwrap().data;

		const postPet = await fetchClient.post('/pet', {
			name: 'jeff',
			photoUrls: []
		});

		postPet.unwrap().data;

		const graphqlClient = createGraphQLFetchClient();
		const graphqlClientWithCache = withGraphQLCache(graphqlClient);
		expect(graphqlClientWithCache._features).toStrictEqual(['graphql', 'graphqlCache']);
	});
});
