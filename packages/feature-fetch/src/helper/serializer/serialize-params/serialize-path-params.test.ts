import { describe, expect, it } from 'vitest';
import { serializePathParams } from './serialize-path-params';

describe('serializePathParams function', () => {
	// Simple style tests
	it('[simple, false] should serialize a primitive value', () => {
		const result = serializePathParams('/users/{id}', { id: 5 });
		expect(result).toEqual('/users/5');
	});

	it('[simple, false] should serialize an array', () => {
		const result = serializePathParams('/users/{id}', { id: [3, 4, 5] });
		expect(result).toEqual('/users/3,4,5');
	});

	it('[simple, false] should serialize an object', () => {
		const result = serializePathParams('/users/{id}', { id: { role: 'admin', firstName: 'Alex' } });
		expect(result).toEqual('/users/role,admin,firstName,Alex');
	});

	// Simple style with explode
	it('[simple, true] should serialize a primitive value', () => {
		const result = serializePathParams('/users/{id*}', { id: 5 });
		expect(result).toEqual('/users/5');
	});

	it('[simple, true] should serialize an array', () => {
		const result = serializePathParams('/users/{id*}', { id: [3, 4, 5] });
		expect(result).toEqual('/users/3,4,5');
	});

	it('[simple, true] should serialize an object', () => {
		const result = serializePathParams('/users/{id*}', {
			id: { role: 'admin', firstName: 'Alex' }
		});
		expect(result).toEqual('/users/role=admin,firstName=Alex');
	});

	// Label style tests
	it('[label, false] should serialize a primitive value', () => {
		const result = serializePathParams('/users/{.id}', { id: 5 });
		expect(result).toEqual('/users/.5');
	});

	it('[label, false] should serialize an array', () => {
		const result = serializePathParams('/users/{.id}', { id: [3, 4, 5] });
		expect(result).toEqual('/users/.3,4,5');
	});

	it('[label, false] should serialize an object', () => {
		const result = serializePathParams('/users/{.id}', {
			id: { role: 'admin', firstName: 'Alex' }
		});
		expect(result).toEqual('/users/.role,admin,firstName,Alex');
	});

	// Label style with explode
	it('[label, true] should serialize a primitive value', () => {
		const result = serializePathParams('/users/{.id*}', { id: 5 });
		expect(result).toEqual('/users/.5');
	});

	it('[label, true] should serialize an array', () => {
		const result = serializePathParams('/users/{.id*}', { id: [3, 4, 5] });
		expect(result).toEqual('/users/.3.4.5');
	});

	it('[label, true] should serialize an object', () => {
		const result = serializePathParams('/users/{.id*}', {
			id: { role: 'admin', firstName: 'Alex' }
		});
		expect(result).toEqual('/users/.role=admin.firstName=Alex');
	});

	// Matrix style tests
	it('[matrix, false] should serialize a primitive value', () => {
		const result = serializePathParams('/users/{;id}', { id: 5 });
		expect(result).toEqual('/users/;id=5');
	});

	it('[matrix, false] should serialize an array', () => {
		const result = serializePathParams('/users/{;id}', { id: [3, 4, 5] });
		expect(result).toEqual('/users/;id=3,4,5');
	});

	it('[matrix, false] should serialize an object', () => {
		const result = serializePathParams('/users/{;id}', {
			id: { role: 'admin', firstName: 'Alex' }
		});
		expect(result).toEqual('/users/;id=role,admin,firstName,Alex');
	});

	// Matrix style with explode
	it('[matrix, true] should serialize a primitive value', () => {
		const result = serializePathParams('/users/{;id*}', { id: 5 });
		expect(result).toEqual('/users/;id=5');
	});

	it('[matrix, true] should serialize an array', () => {
		const result = serializePathParams('/users/{;id*}', { id: [3, 4, 5] });
		expect(result).toEqual('/users/;id=3;id=4;id=5');
	});

	it('[matrix, true] should serialize an object', () => {
		const result = serializePathParams('/users/{;id*}', {
			id: { role: 'admin', firstName: 'Alex' }
		});
		expect(result).toEqual('/users/;role=admin;firstName=Alex');
	});
});
