import { describe, expect, it } from 'vitest';
import {
	createFeatureHost,
	defineFeature,
	hasFeature,
	installFeature,
	type TAnyFeature,
	type TDeclaredFeature,
	type TInstalledFeature,
	type TFeatureHost
} from './index';

describe('feature-core', () => {
	it('should install ordered features through variadic and chained calls', () => {
		// Prepare
		const counter = createCounter(0).with(resetFeature(), resetTwiceFeature()).with(loggerFeature());

		// Act
		counter.set(5);
		const loggedValue = counter.log();
		counter.resetTwice();

		// Assert
		expect(loggedValue).toBe(5);
		expect(counter.get()).toBe(0);
		expect(counter._features).toStrictEqual(['reset', 'resetTwice', 'logger']);
		expect(hasFeature(counter, 'reset')).toBe(true);
		expect(hasFeature(counter, 'missing')).toBe(false);
		expect(hasFeature({}, 'reset')).toBe(false);
		expect(hasFeature({ _features: ['reset'] }, 'reset')).toBe(false);
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

	it('should throw when a feature requirement is missing at runtime', () => {
		// Prepare
		const counter = createCounter(0);
		const feature = resetTwiceFeature() as unknown as TAnyFeature;

		// Act & Assert
		expect(() => {
			installFeatureUnchecked(counter as TFeatureHost<object, TInstalledFeature[]>, feature);
		}).toThrow('Feature "resetTwice" requires missing feature "reset"');
	});

	it('should throw when a feature is installed twice', () => {
		// Prepare
		const counter = createCounter(0).with(resetFeature());

		// Act & Assert
		expect(() => {
			counter.with(resetFeature());
		}).toThrow('Feature "reset" is already installed');
	});

	it('should throw when a feature overwrites an existing property', () => {
		// Prepare
		const counter = createCounter(0);
		const symbolKey = Symbol('value');
		const symbolHost = createFeatureHost({ [symbolKey]: 1 });

		// Act & Assert
		expect(() => {
			counter.with(overwriteGetFeature());
		}).toThrow('Feature "overwriteGet" cannot overwrite existing property "get"');
		expect(() => {
			symbolHost.with(overwriteSymbolFeature(symbolKey));
		}).toThrow('Feature "overwriteSymbol" cannot overwrite existing property "Symbol(value)"');
	});

	it('should throw when a base object already uses feature host properties', () => {
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

function resetFeature(): TDeclaredFeature<TResetFeature> {
	return defineFeature({
		key: 'reset',
		install<GFeatures extends TCounterFeature[]>(counter: TCounter<GFeatures>) {
			const initialValue = counter.get();

			return {
				reset() {
					counter.set(initialValue);
				}
			};
		}
	});
}

function resetTwiceFeature(): TDeclaredFeature<TResetTwiceFeature, [TResetFeature]> {
	return defineFeature({
		key: 'resetTwice',
		requires: ['reset'] as const,
		install(counter: TCounter<[TResetFeature]>) {
			return {
				resetTwice() {
					counter.reset();
					counter.reset();
				}
			};
		}
	});
}

function resetWithThisFeature(): TDeclaredFeature<TResetWithThisFeature> {
	return defineFeature({
		key: 'resetWithThis',
		install<GFeatures extends TCounterFeature[]>(counter: TCounter<GFeatures>) {
			const initialValue = counter.get();

			return {
				resetWithThis(this: TCounterBase) {
					this.set(initialValue);
				}
			};
		}
	});
}

function loggerFeature(): TDeclaredFeature<TLoggerFeature> {
	return defineFeature({
		key: 'logger',
		install<GFeatures extends TCounterFeature[]>(counter: TCounter<GFeatures>) {
			return {
				log() {
					return counter.get();
				}
			};
		}
	});
}

function metaFeature(): TDeclaredFeature<TMetaFeature> {
	return defineFeature({
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

type TCounterFeature =
	| TResetFeature
	| TResetTwiceFeature
	| TResetWithThisFeature
	| TLoggerFeature
	| TMetaFeature;

interface TResetFeature {
	key: 'reset';
	api: {
		reset: () => void;
	};
}

interface TResetTwiceFeature {
	key: 'resetTwice';
	api: {
		resetTwice: () => void;
	};
}

interface TResetWithThisFeature {
	key: 'resetWithThis';
	api: {
		resetWithThis: (this: TCounterBase) => void;
	};
}

interface TLoggerFeature {
	key: 'logger';
	api: {
		log: () => number;
	};
}

interface TMetaFeature {
	key: 'meta';
	api: Record<never, never>;
}

function installFeatureUnchecked(
	host: TFeatureHost<object, TInstalledFeature[]>,
	feature: TAnyFeature
): unknown {
	const uncheckedInstallFeature = installFeature as unknown as (
		host: TFeatureHost<object, TInstalledFeature[]>,
		feature: TAnyFeature
	) => unknown;
	return uncheckedInstallFeature(host, feature);
}
