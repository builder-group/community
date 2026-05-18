import { describe, expect, it } from 'vitest';
import {
	createFeatureHost,
	defineFeature,
	hasFeature,
	installFeature,
	type TFeature,
	type TFeatureHost
} from './index';

describe('feature-core', () => {
	describe('createFeatureHost', () => {
		it('should add feature host metadata to a base object', () => {
			// Prepare
			const base = { value: 1 };

			// Act
			const host = createFeatureHost(base);

			// Assert
			expect(host).toBe(base);
			expect(host.value).toBe(1);
			expect(host._features).toStrictEqual([]);
			expect(host.with).toBeTypeOf('function');
		});

		it('should throw when the base object already defines with', () => {
			// Prepare
			const base = {
				with() {
					return undefined;
				}
			};

			// Act & Assert
			expect(() => {
				createFeatureHost(base);
			}).toThrow('Feature host cannot overwrite existing property "with"');
		});

		it('should throw when the base object already defines _features', () => {
			// Prepare
			const base = {
				_features: []
			};

			// Act & Assert
			expect(() => {
				createFeatureHost(base);
			}).toThrow('Feature host cannot overwrite existing property "_features"');
		});
	});

	describe('defineFeature', () => {
		it('should create a feature with empty requirements by default', () => {
			// Prepare
			const feature = defineFeature({
				key: 'enabled',
				install() {
					return {
						isEnabled() {
							return true;
						}
					};
				}
			});

			// Act
			const api = feature.install(undefined as never);

			// Assert
			expect(feature.key).toBe('enabled');
			expect(feature.requires).toStrictEqual([]);
			expect(api.isEnabled()).toBe(true);
		});

		it('should keep declared runtime requirements', () => {
			// Act
			const feature = resetTwiceFeature();

			// Assert
			expect(feature.key).toBe('resetTwice');
			expect(feature.requires).toStrictEqual(['reset']);
		});
	});

	describe('installFeature', () => {
		it('should install a feature API on a host', () => {
			// Prepare
			const counter = createCounter(0);

			// Act
			const counterWithReset = installFeature(counter, resetFeature());
			counterWithReset.set(5);
			counterWithReset.reset();

			// Assert
			expect(counterWithReset.get()).toBe(0);
			expect(counterWithReset._features).toStrictEqual(['reset']);
		});

		it('should throw when a required feature is missing', () => {
			// Prepare
			const counter = createCounter(0);
			const feature = resetTwiceFeature();

			// Act & Assert
			expect(() => {
				installFeature(counter, feature as unknown as TFeature<string, object>);
			}).toThrow('Feature "resetTwice" requires missing feature "reset"');
		});

		it('should throw when a feature is installed twice', () => {
			// Prepare
			const counter = createCounter(0).with(resetFeature());

			// Act & Assert
			expect(() => {
				installFeature(counter as unknown as TCounter<[]>, resetFeature());
			}).toThrow('Feature "reset" is already installed');
		});

		it('should throw when a feature API overwrites an existing string property', () => {
			// Prepare
			const counter = createCounter(0);

			// Act & Assert
			expect(() => {
				installFeature(counter, overwriteGetFeature());
			}).toThrow('Feature "overwriteGet" cannot overwrite existing property "get"');
		});

		it('should throw when a feature API overwrites an existing symbol property', () => {
			// Prepare
			const symbolKey = Symbol('value');
			const host = createFeatureHost({ [symbolKey]: 1 });

			// Act & Assert
			expect(() => {
				installFeature(host, overwriteSymbolFeature(symbolKey));
			}).toThrow('Feature "overwriteSymbol" cannot overwrite existing property "Symbol(value)"');
		});
	});

	describe('hasFeature', () => {
		it('should return true when a feature key is installed', () => {
			// Prepare
			const counter = createCounter(0).with(resetFeature());

			// Act
			const result = hasFeature(counter, 'reset');

			// Assert
			expect(result).toBe(true);
		});

		it('should return false when a feature key is missing', () => {
			// Prepare
			const counter = createCounter(0).with(resetFeature());

			// Act
			const result = hasFeature(counter, 'logger');

			// Assert
			expect(result).toBe(false);
		});

		it('should return false for values that are not feature hosts', () => {
			// Act & Assert
			expect(hasFeature({}, 'reset')).toBe(false);
			expect(hasFeature({ _features: ['reset'] }, 'reset')).toBe(false);
			expect(hasFeature(null, 'reset')).toBe(false);
		});
	});

	describe('host.with', () => {
		it('should install chained features in order', () => {
			// Prepare
			const counter = createCounter(0)
				.with(resetFeature())
				.with(resetTwiceFeature())
				.with(loggerFeature());

			// Act
			counter.set(5);
			const loggedValue = counter.log();
			counter.resetTwice();

			// Assert
			expect(loggedValue).toBe(5);
			expect(counter.get()).toBe(0);
			expect(counter._features).toStrictEqual(['reset', 'resetTwice', 'logger']);
		});

		it('should install variadic features in order', () => {
			// Prepare
			const counter = createCounter(0).with(resetFeature(), resetTwiceFeature(), loggerFeature());

			// Act
			counter.set(5);
			const loggedValue = counter.log();
			counter.resetTwice();

			// Assert
			expect(loggedValue).toBe(5);
			expect(counter.get()).toBe(0);
			expect(counter._features).toStrictEqual(['reset', 'resetTwice', 'logger']);
		});

		it('should support api-less features', () => {
			// Prepare
			const counter = createCounter(0);

			// Act
			const counterWithMeta = counter.with(metaFeature());

			// Assert
			expect(counterWithMeta._features).toStrictEqual(['meta']);
		});

		it('should support feature methods that declare this explicitly', () => {
			// Prepare
			const counter = createCounter(0).with(resetWithThisFeature());

			// Act
			counter.set(10);
			counter.resetWithThis();

			// Assert
			expect(counter.get()).toBe(0);
		});
	});
});

function createCounter(initialValue: number): TCounter<[]> {
	let value = initialValue;
	const base: TCounterBase = {
		get() {
			return value;
		},
		set(nextValue) {
			value = nextValue;
		}
	};

	return createFeatureHost(base);
}

function resetFeature(): TResetFeature {
	return defineFeature<TResetFeature>({
		key: 'reset',
		install(counter: TCounterBase) {
			const initialValue = counter.get();

			return {
				reset() {
					counter.set(initialValue);
				}
			};
		}
	});
}

function resetTwiceFeature(): TResetTwiceFeature {
	return defineFeature<TResetTwiceFeature>({
		key: 'resetTwice',
		requires: ['reset'],
		install(counter) {
			return {
				resetTwice() {
					counter.reset();
					counter.reset();
				}
			};
		}
	});
}

function resetWithThisFeature(): TResetWithThisFeature {
	return defineFeature<TResetWithThisFeature>({
		key: 'resetWithThis',
		install(counter: TCounterBase) {
			const initialValue = counter.get();

			return {
				resetWithThis(this: TCounterBase) {
					this.set(initialValue);
				}
			};
		}
	});
}

function loggerFeature(): TLoggerFeature {
	return defineFeature<TLoggerFeature>({
		key: 'logger',
		install(counter: TCounterBase) {
			return {
				log() {
					return counter.get();
				}
			};
		}
	});
}

function metaFeature(): TMetaFeature {
	return defineFeature<TMetaFeature>({
		key: 'meta',
		install() {
			return {};
		}
	});
}

function overwriteGetFeature() {
	return defineFeature({
		key: 'overwriteGet',
		install() {
			return {
				get() {
					return 1;
				}
			};
		}
	});
}

function overwriteSymbolFeature(symbolKey: symbol) {
	return defineFeature({
		key: 'overwriteSymbol',
		install() {
			return {
				[symbolKey]: 2
			};
		}
	});
}

interface TCounterBase {
	get: () => number;
	set: (nextValue: number) => void;
}

type TCounter<GFeatures extends TCounterFeature[]> = TFeatureHost<TCounterBase, GFeatures>;

type TResetFeature = TFeature<'reset', { reset(): void }>;
type TResetTwiceFeature = TFeature<'resetTwice', { resetTwice(): void }, [TResetFeature]>;
type TResetWithThisFeature = TFeature<'resetWithThis', { resetWithThis(this: TCounterBase): void }>;
type TLoggerFeature = TFeature<'logger', { log(): number }>;
type TMetaFeature = TFeature<'meta', Record<never, never>>;

type TCounterFeature =
	| TResetFeature
	| TResetTwiceFeature
	| TResetWithThisFeature
	| TLoggerFeature
	| TMetaFeature;
