import { describe, expect, it } from 'vitest';
import { GraphQLError } from './GraphQLError';

describe('GraphQLError class', () => {
	it('should format one GraphQL error message', () => {
		// Prepare
		const response = new Response();

		// Act
		const error = new GraphQLError([{ message: 'User not found' }], {
			response
		});

		// Assert
		expect(error.name).toBe('GraphQLError');
		expect(error.code).toBe('#ERR_GRAPHQL_OPERATION');
		expect(error.message).toBe('[#ERR_GRAPHQL_OPERATION] GraphQL operation failed: User not found');
		expect(error.response).toBe(response);
	});

	it('should format multiple GraphQL error messages', () => {
		// Prepare
		const errors = [
			{
				message: 'User not found'
			},
			{
				message: 'Missing permission'
			}
		];

		// Act
		const error = new GraphQLError(errors, {
			response: new Response()
		});

		// Assert
		expect(error.message).toBe(
			'[#ERR_GRAPHQL_OPERATION] GraphQL operation failed with 2 errors: User not found, Missing permission'
		);
	});

	it('should keep GraphQL response details', () => {
		// Prepare
		const response = new Response();
		const errors = [
			{
				message: 'User not found'
			}
		];

		// Act
		const error = new GraphQLError(errors, {
			data: {
				user: null
			},
			extensions: {
				requestId: 'request-1'
			},
			response
		});

		// Assert
		expect(error.errors).toBe(errors);
		expect(error.data).toEqual({
			user: null
		});
		expect(error.extensions).toEqual({
			requestId: 'request-1'
		});
		expect(error.response).toBe(response);
	});
});
