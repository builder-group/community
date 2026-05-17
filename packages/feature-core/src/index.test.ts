import { describe, expect, it } from 'vitest';
import {
	createFeatureHost,
	defineFeature,
	hasFeature,
	installFeature,
	type TAnyFeature,
	type TFeatureDefinition,
	type TFeatureHost
} from './index';

describe('feature-core', () => {
	it('should extend a host with a single feature', () => {
		// Prepare
		const counter = createCounter(0).with(resetFeature());

		// Act
		counter.set(10);
		counter.reset();

		// Assert
		expect(counter.get()).toBe(0);
		expect(counter._features).toStrictEqual(['reset']);
	});

	it('should extend a host with multiple ordered features', () => {
		// Prepare
		const counter = createCounter(0).with(resetFeature(), resetTwiceFeature());

		// Act
		counter.set(10);
		counter.resetTwice();

		// Assert
		expect(counter.get()).toBe(0);
		expect(counter._features).toStrictEqual(['reset', 'resetTwice']);
	});

	it('should support chained features', () => {
		// Prepare
		const counter = createCounter(1).with(resetFeature()).with(loggerFeature());

		// Act
		counter.set(2);

		// Assert
		expect(counter.log()).toBe(2);
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
			installFeatureUnchecked(counter as TFeatureHost<object, TFeatureDefinition[]>, feature);
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

		// Act & Assert
		expect(() => {
			counter.with(overwriteGetFeature());
		}).toThrow('Feature "overwriteGet" cannot overwrite existing property "get"');
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

	it('should check installed features', () => {
		// Prepare
		const counter = createCounter(0).with(resetFeature());

		// Assert
		expect(hasFeature(counter, 'reset')).toBe(true);
		expect(hasFeature(counter, 'logger')).toBe(false);
	});

	it('should keep consumer and feature author types intact', () => {
		// Prepare
		const counter = createCounter(0).with(resetFeature()).with(resetTwiceFeature());

		// Act
		counter.set(5);
		counter.reset();
		counter.resetTwice();

		// Assert
		const value: number = counter.get();
		const featureName = counter._features[0];
		if (featureName == null) {
			throw new Error('Expected a feature name');
		}

		expect(value).toBe(0);
		expect(featureName).toBe('reset');
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

function resetFeature() {
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

function resetTwiceFeature() {
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

function resetWithThisFeature() {
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

function loggerFeature() {
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

function metaFeature() {
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

interface TCounterBase {
	get: () => number;
	set: (nextValue: number) => void;
}

type TCounter<GFeatures extends TCounterFeature[]> = TFeatureHost<TCounterBase, GFeatures>;

type TCounterFeature = TResetFeature | TResetTwiceFeature | TResetWithThisFeature | TLoggerFeature;

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

function installFeatureUnchecked(
	host: TFeatureHost<object, TFeatureDefinition[]>,
	feature: TAnyFeature
): unknown {
	const uncheckedInstallFeature = installFeature as unknown as (
		host: TFeatureHost<object, TFeatureDefinition[]>,
		feature: TAnyFeature
	) => unknown;
	return uncheckedInstallFeature(host, feature);
}
