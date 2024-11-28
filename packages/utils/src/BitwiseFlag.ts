export class BitwiseFlag<T extends number> {
	private value: number;

	constructor(...initialValues: T[]) {
		this.value = initialValues.reduce((acc, flag) => acc | flag, 0);
	}

	add(flag: T): this {
		this.value |= flag;
		return this;
	}

	remove(flag: T): this {
		this.value &= ~flag;
		return this;
	}

	has(flag: T): boolean {
		return (this.value & flag) !== 0;
	}

	reset(): this {
		this.value = 0;
		return this;
	}
}

export function bitwiseFlag<T extends number>(...values: T[]): BitwiseFlag<T> {
	return new BitwiseFlag(...values);
}
