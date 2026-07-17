import type { $Read, $Write, OperationRequestBodyContent } from 'openapi-typescript-helpers';
import { describe, expectTypeOf, it } from 'vitest';
import type { components, paths } from '../__tests__/resources/mock-openapi-types';
import { createFetchClient } from '../create-fetch-client';
import { isHttpError } from '../errors';
import type { TFetchClient } from '../types';
import { createOpenApiFetchClient, openApiFeature, type TOpenApiFeature } from './openapi';

describe('openApiFeature function', () => {
	describe('feature composition', () => {
		it('should add OpenAPI helpers through the feature-core chain', () => {
			const client = createFetchClient().with(openApiFeature<paths>());

			expectTypeOf(client).toHaveProperty('get');
			expectTypeOf(client).toHaveProperty('post');
			expectTypeOf(client).toHaveProperty('delete');
			expectTypeOf(client._features).toEqualTypeOf<readonly 'openapi'[]>();
			expectTypeOf(client).toEqualTypeOf<TFetchClient<[TOpenApiFeature<paths>]>>();
		});
	});

	describe('schema paths', () => {
		it('should only accept schema paths for the selected method', () => {
			const client = createOpenApiFetchClient<paths>();

			void client.post('/pet', {
				body: {
					name: 'Jeff',
					photoUrls: []
				}
			});
			void client.get('/pet/{petId}', {
				pathParams: {
					petId: 10
				}
			});

			// @ts-expect-error /pet does not declare a GET operation.
			void client.get('/pet');

			// @ts-expect-error OpenAPI clients only accept paths declared by the schema.
			void client.get('/missing');
		});

		it('should only accept string schema paths', () => {
			const client = createOpenApiFetchClient<TNumericPathKeyPaths>();

			void client.get('/items');

			// @ts-expect-error fetch paths must be strings even if a generic path map has numeric keys.
			void client.get(1);
		});
	});

	describe('request options', () => {
		it('should require path params declared by the operation', () => {
			const client = createOpenApiFetchClient<paths>();

			void client.get('/pet/{petId}', {
				pathParams: {
					petId: 10
				}
			});

			// @ts-expect-error petId is required by the OpenAPI operation.
			void client.get('/pet/{petId}');
		});

		it('should keep optional query params optional', () => {
			const client = createOpenApiFetchClient<paths>();

			void client.get('/pet/findByStatus');
			void client.get('/pet/findByStatus', {
				queryParams: {
					status: 'available'
				}
			});

			void client.get('/pet/findByStatus', {
				// @ts-expect-error this operation does not declare path params.
				pathParams: {
					petId: 10
				}
			});
		});

		it('should require query params declared by the operation', () => {
			const client = createOpenApiFetchClient<TRequiredQueryPaths>();

			void client.get('/search', {
				queryParams: {
					q: 'jeff'
				}
			});

			// @ts-expect-error queryParams is required by the OpenAPI operation.
			void client.get('/search');

			void client.get('/search', {
				// @ts-expect-error q is required inside queryParams.
				queryParams: {
					limit: 10
				}
			});
		});

		it('should require request bodies declared by the operation', () => {
			const client = createOpenApiFetchClient<paths>();

			void client.post('/pet', {
				body: {
					name: 'Jeff',
					photoUrls: []
				}
			});

			// @ts-expect-error body is required by the OpenAPI operation.
			void client.post('/pet');
		});

		it('should allow optional request bodies declared by the operation', () => {
			const client = createOpenApiFetchClient<paths>();

			void client.post('/store/order');
			void client.post('/store/order', {
				body: {
					petId: 10
				}
			});
		});

		it('should not expose request bodies for operations without a body', () => {
			const client = createOpenApiFetchClient<TPostNoBodyPaths>();

			expectTypeOf<
				OperationRequestBodyContent<TPostNoBodyPaths['/events']['post']>
			>().toEqualTypeOf<undefined>();

			void client.post('/events', {
				// @ts-expect-error this operation does not declare a request body serializer.
				bodySerializer: () => ''
			});

			void client.post('/events', {
				// @ts-expect-error this operation does not declare a request body.
				body: {
					ok: true
				}
			});
		});

		it('should require OpenAPI header params and allow additional headers', () => {
			const client = createOpenApiFetchClient<THeaderPaths>();

			void client.get('/items', {
				headers: {
					'X-Tenant-Id': 'tenant-1',
					'Authorization': 'Bearer token'
				}
			});

			// @ts-expect-error X-Tenant-Id is required by the OpenAPI operation.
			void client.get('/items');

			void client.get('/items', {
				// @ts-expect-error X-Tenant-Id is required inside top-level headers.
				headers: {
					Authorization: 'Bearer token'
				}
			});
		});

		it('should allow native headers when the operation declares no header params', () => {
			const client = createOpenApiFetchClient<TNoParameterPaths>();

			void client.get('/status');
			void client.get('/status', {
				headers: new Headers({
					Authorization: 'Bearer token'
				})
			});
		});

		it('should allow request bodies declared by DELETE operations', () => {
			const client = createOpenApiFetchClient<TDeleteBodyPaths>();

			void client.delete('/items/{itemId}', {
				body: {
					reason: 'duplicate'
				},
				pathParams: {
					itemId: 'item-1'
				}
			});
		});
	});

	describe('response inference', () => {
		it('should infer success data by default', async () => {
			const client = createOpenApiFetchClient<paths>();

			const result = await client.get('/pet/{petId}', {
				pathParams: {
					petId: 10
				}
			});
			if (result.isOk()) {
				expectTypeOf(result.value).toEqualTypeOf<components['schemas']['Pet']>();
			}
		});

		it('should infer response details when requested', async () => {
			const client = createOpenApiFetchClient<paths>();

			const result = await client.get('/pet/{petId}', {
				pathParams: {
					petId: 10
				},
				withResponse: true
			});
			if (result.isOk()) {
				expectTypeOf(result.value).toEqualTypeOf<{
					data: components['schemas']['Pet'];
					response: Response;
				}>();
			}
		});

		it('should infer JSON suffix media types', async () => {
			const client = createOpenApiFetchClient<TJsonSuffixPaths>();

			const result = await client.get('/problem');
			if (result.isOk()) {
				expectTypeOf(result.value).toEqualTypeOf<{ ok: boolean }>();
			}
		});

		it('should infer parser return types for non-json parse modes', async () => {
			const client = createOpenApiFetchClient<paths>();

			const result = await client.get('/pet/{petId}', {
				pathParams: {
					petId: 10
				},
				parseAs: 'text'
			});
			if (result.isOk()) {
				expectTypeOf(result.value).toEqualTypeOf<string>();
			}
		});

		it('should keep default responses out of the success branch', async () => {
			const client = createOpenApiFetchClient<paths>();

			const result = await client.post('/user', {
				body: {
					username: 'jeff'
				}
			});
			if (result.isOk()) {
				expectTypeOf(result.value).toEqualTypeOf<never>();
			}
		});

		it('should preserve typed error data', async () => {
			const client = createOpenApiFetchClient<TReadWritePaths>();

			const result = await client.post('/users', {
				body: {
					username: 'jeff',
					password: 'secret'
				}
			});
			if (result.isErr() && isHttpError(result.error)) {
				expectTypeOf(result.error.data).toEqualTypeOf<{ message: string } | undefined>();
				expectTypeOf(result.error.data).not.toBeAny();
			}
		});
	});

	describe('read and write markers', () => {
		it('should apply OpenAPI read and write markers', async () => {
			const client = createOpenApiFetchClient<TReadWritePaths>();

			void client.post('/users', {
				body: {
					username: 'jeff',
					password: 'secret'
				}
			});

			void client.post('/users', {
				body: {
					// @ts-expect-error readOnly fields cannot be sent in request bodies.
					id: 'user-1',
					username: 'jeff',
					password: 'secret'
				}
			});

			const result = await client.post('/users', {
				body: {
					username: 'jeff',
					password: 'secret'
				}
			});
			if (result.isOk()) {
				expectTypeOf(result.value).toEqualTypeOf<{
					id: string;
					username: string;
				}>();
			}
		});
	});
});

interface THeaderPaths {
	'/items': {
		get: {
			parameters: {
				header: {
					'X-Tenant-Id': string;
				};
				cookie?: never;
				path?: never;
				query?: never;
			};
			requestBody?: never;
			responses: {
				200: {
					content: {
						'application/json': {
							ok: boolean;
						};
					};
				};
			};
		};
	};
}

interface TRequiredQueryPaths {
	'/search': {
		get: {
			parameters: {
				cookie?: never;
				header?: never;
				path?: never;
				query: {
					q: string;
					limit?: number;
				};
			};
			requestBody?: never;
			responses: {
				200: {
					content: {
						'application/json': {
							ok: boolean;
						};
					};
				};
			};
		};
	};
}

interface TNumericPathKeyPaths {
	1: {
		get: {
			requestBody?: never;
			responses: {
				200: {
					content: {
						'application/json': {
							ok: boolean;
						};
					};
				};
			};
		};
	};
	'/items': {
		get: {
			requestBody?: never;
			responses: {
				200: {
					content: {
						'application/json': {
							ok: boolean;
						};
					};
				};
			};
		};
	};
}

interface TPostNoBodyPaths {
	'/events': {
		post: {
			requestBody?: never;
			responses: {
				200: {
					content: {
						'application/json': {
							ok: boolean;
						};
					};
				};
			};
		};
	};
}

interface TReadWritePaths {
	'/users': {
		post: {
			requestBody: {
				content: {
					'application/json': {
						id?: $Read<string>;
						username: string;
						password: $Write<string>;
					};
				};
			};
			responses: {
				200: {
					content: {
						'application/json': {
							id: $Read<string>;
							username: string;
							password: $Write<string>;
						};
					};
				};
				400: {
					content: {
						'application/json': {
							message: string;
							debug: $Write<string>;
						};
					};
				};
			};
		};
	};
}

interface TDeleteBodyPaths {
	'/items/{itemId}': {
		delete: {
			parameters: {
				cookie?: never;
				header?: never;
				path: {
					itemId: string;
				};
				query?: never;
			};
			requestBody: {
				content: {
					'application/json': {
						reason: string;
					};
				};
			};
			responses: {
				200: {
					content: {
						'application/json': {
							ok: boolean;
						};
					};
				};
			};
		};
	};
}

interface TNoParameterPaths {
	'/status': {
		get: {
			requestBody?: never;
			responses: {
				200: {
					content: {
						'application/json': {
							ok: boolean;
						};
					};
				};
			};
		};
	};
}

interface TJsonSuffixPaths {
	'/problem': {
		get: {
			requestBody?: never;
			responses: {
				200: {
					content: {
						'application/problem+json': {
							ok: boolean;
						};
					};
				};
			};
		};
	};
}
