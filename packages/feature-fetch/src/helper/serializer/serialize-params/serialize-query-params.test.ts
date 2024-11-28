import { describe, expect, it } from 'vitest';
import { serializeQueryParams } from './serialize-query-params';

describe('serializeQueryParams function', () => {
	// Default form style with explode
	it('[form, true] should serialize a primitive value', () => {
		const result = serializeQueryParams(
			{ id: 5 },
			{ array: { style: 'form', explode: true }, object: { style: 'form', explode: true } }
		);
		expect(result).toEqual('id=5');
	});

	it('[form, true] should serialize an array', () => {
		const result = serializeQueryParams(
			{ id: [3, 4, 5] },
			{ array: { style: 'form', explode: true }, object: { style: 'form', explode: true } }
		);
		expect(result).toEqual('id=3&id=4&id=5');
	});

	it('[form, true] should serialize an object', () => {
		const result = serializeQueryParams(
			{ id: { role: 'admin', firstName: 'Alex' } },
			{ array: { style: 'form', explode: true }, object: { style: 'form', explode: true } }
		);
		expect(result).toEqual('role=admin&firstName=Alex');
	});

	// Form style without explode
	it('[form, false] should serialize a primitive value', () => {
		const result = serializeQueryParams(
			{ id: 5 },
			{ array: { style: 'form', explode: false }, object: { style: 'form', explode: false } }
		);
		expect(result).toEqual('id=5');
	});

	it('[form, false] should serialize an array', () => {
		const result = serializeQueryParams(
			{ id: [3, 4, 5] },
			{ array: { style: 'form', explode: false }, object: { style: 'form', explode: false } }
		);
		expect(result).toEqual('id=3,4,5');
	});

	it('[form, false] should serialize an object', () => {
		const result = serializeQueryParams(
			{ id: { role: 'admin', firstName: 'Alex' } },
			{ array: { style: 'form', explode: false }, object: { style: 'form', explode: false } }
		);
		expect(result).toEqual('id=role,admin,firstName,Alex');
	});

	// SpaceDelimited style
	it('[spaceDelimited, true] should serialize an array', () => {
		const result = serializeQueryParams(
			{ id: [3, 4, 5] },
			{ array: { style: 'spaceDelimited', explode: true } }
		);
		expect(result).toEqual('id=3&id=4&id=5');
	});

	it('[spaceDelimited, false] should serialize an array', () => {
		const result = serializeQueryParams(
			{ id: [3, 4, 5] },
			{ array: { style: 'spaceDelimited', explode: false } }
		);
		expect(result).toEqual('id=3%204%205');
	});

	// PipeDelimited style
	it('[pipeDelimited, true] should serialize an array', () => {
		const result = serializeQueryParams(
			{ id: [3, 4, 5] },
			{ array: { style: 'pipeDelimited', explode: true } }
		);
		expect(result).toEqual('id=3&id=4&id=5');
	});

	it('[pipeDelimited, false] should serialize an array', () => {
		const result = serializeQueryParams(
			{ id: [3, 4, 5] },
			{ array: { style: 'pipeDelimited', explode: false } }
		);
		expect(result).toEqual('id=3|4|5');
	});

	// DeepObject style
	it('[deepObject, true] should serialize an object', () => {
		const result = serializeQueryParams(
			{ id: { role: 'admin', firstName: 'Alex' } },
			{ object: { style: 'deepObject', explode: true } }
		);
		expect(result).toEqual('id[role]=admin&id[firstName]=Alex');
	});
});
