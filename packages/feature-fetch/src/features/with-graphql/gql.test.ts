import { describe, expect, it } from 'vitest';
import { gql } from './gql';

describe('gql function', () => {
	it('should return an empty string when given an empty template literal', () => {
		const result = gql``;
		expect(result).toBe('');
	});

	it('should return the string as-is when given a single string', () => {
		const result = gql`
			query {
				user {
					name
				}
			}
		`;
		expect(result).toBe(`
			query {
				user {
					name
				}
			}
		`);
	});

	it('should interpolate a single value correctly', () => {
		const name = 'John';
		const result = gql`query { user(name: "${name}") { id } }`;
		expect(result).toBe('query { user(name: "John") { id } }');
	});

	it('should interpolate multiple values correctly', () => {
		const name = 'John';
		const age = 30;
		const result = gql`
      query {
        user(name: "${name}", age: ${age}) {
          id
          email
        }
      }
    `;
		expect(result).toBe(`
      query {
        user(name: "John", age: 30) {
          id
          email
        }
      }
    `);
	});

	it('should handle different types of interpolated values', () => {
		const id = 123;
		const active = true;
		const tags = ['user', 'admin'];
		const result = gql`
      mutation {
        updateUser(id: ${id}, active: ${active}, tags: ${JSON.stringify(tags)}) {
          success
        }
      }
    `;
		expect(result).toBe(`
      mutation {
        updateUser(id: 123, active: true, tags: ["user","admin"]) {
          success
        }
      }
    `);
	});

	it('should handle empty interpolated values', () => {
		const emptyString = '';
		const result = gql`query { user(name: "${emptyString}") { id } }`;
		expect(result).toBe('query { user(name: "") { id } }');
	});
});
