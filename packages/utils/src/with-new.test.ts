import { describe, expect, it } from 'vitest';
import { withNew } from './with-new';

describe('withNew function', () => {
	it('should initialize object without arguments', () => {
		const testObj = {
			value: 0,
			_new() {
				this.value = 42;
			}
		};

		const result = withNew(testObj);
		expect(result.value).toBe(42);
		expect('_new' in result).toBe(false);
	});

	it('should initialize object with a single argument', () => {
		const testObj = {
			value: 0,
			_new(newValue: number) {
				this.value = newValue;
			}
		};

		const result = withNew(testObj, 123);
		expect(result.value).toBe(123);
		expect('_new' in result).toBe(false);
	});

	it('should initialize object with multiple arguments', () => {
		type TTestObj = {
			name: string;
			age: number;
			active: boolean;
			_new(name: string, age: number, active: boolean): void;
		};

		const testObj: TTestObj = {
			name: '',
			age: 0,
			active: false,
			_new(name: string, age: number, active: boolean) {
				this.name = name;
				this.age = age;
				this.active = active;
			}
		};

		const result = withNew(testObj, 'John', 30, true);
		expect(result.name).toBe('John');
		expect(result.age).toBe(30);
		expect(result.active).toBe(true);
		expect('_new' in result).toBe(false);
	});

	it('should return object as is if no new function present', () => {
		const testObj = {
			value: 42
		} as any;

		const result = withNew(testObj);
		expect(result).toBe(testObj);
		expect(result.value).toBe(42);
	});

	it('should preserve object structure after initialization', () => {
		const testObj = {
			nested: { value: 0 },
			_new() {
				this.nested.value = 42;
			}
		};

		const result = withNew(testObj);
		expect(result.nested.value).toBe(42);
		expect('_new' in result).toBe(false);
		expect(result.nested).toBe(testObj.nested);
	});
});
