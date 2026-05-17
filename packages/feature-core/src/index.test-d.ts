import { assertType, describe, expectTypeOf, it } from 'vitest';
import {
	createFeatureHost,
	defineFeature,
	hasFeature,
	installFeature,
	type TDeclaredFeature,
	type TFeatureHost
} from './index';

describe('feature-core types', () => {
	it('should infer consumer APIs and installed feature tuples', () => {
		const counter = createCounter(0);
		const resetCounter = createCounter(0).with(resetFeature());
		const fullCounter = createCounter(0)
			.with(resetFeature(), resetTwiceFeature())
			.with(loggerFeature());
		const longCounter = createCounter(0).with(
			resetFeature(),
			resetTwiceFeature(),
			loggerFeature(),
			labelFeature(),
			metaFeature(),
			auditFeature()
		);

		assertType<number>(counter.get());
		assertType<number>(fullCounter.log());
		assertType<string>(longCounter.label());
		assertType<number>(longCounter.audit());
		expectTypeOf(resetCounter.reset).returns.toBeVoid();
		expectTypeOf(fullCounter.resetTwice).returns.toBeVoid();
		expectTypeOf(longCounter._features).toEqualTypeOf<
			readonly ('reset' | 'resetTwice' | 'logger' | 'label' | 'meta' | 'audit')[]
		>();
		expectTypeOf(fullCounter._features).toEqualTypeOf<
			readonly ('reset' | 'resetTwice' | 'logger')[]
		>();
		expectTypeOf(resetCounter).toEqualTypeOf<TCounter<[TResetFeature]>>();
		expectTypeOf(fullCounter).toEqualTypeOf<
			TCounter<[TResetFeature, TResetTwiceFeature, TLoggerFeature]>
		>();
		expectTypeOf(installFeature(createCounter(0), resetFeature())).toEqualTypeOf<
			TCounter<[TResetFeature]>
		>();
	});

	it('should reject missing dependencies and unavailable APIs', () => {
		const counter = createCounter(0);

		// @ts-expect-error resetTwiceFeature requires resetFeature first.
		counter.with(resetTwiceFeature());

		// @ts-expect-error reset is not available before resetFeature is installed.
		counter.reset();

		// @ts-expect-error _features is visible but readonly.
		counter._features.push('reset');
	});

	it('should narrow a matching key capability with hasFeature', () => {
		const counter = createCounter(0).with(loggerFeature());
		const unknownCounter: unknown = counter;

		if (hasFeature<TLoggerFeature>(unknownCounter, 'logger')) {
			assertType<number>(unknownCounter.log());
		}
	});

	it('should reject features with incompatible install hosts', () => {
		const counter = createCounter(0);

		// @ts-expect-error inferredConstrainedFeature requires a host with resetFeature installed.
		counter.with(inferredConstrainedFeature());
	});

	it('should reject declared features with mismatching contracts', () => {
		// @ts-expect-error declared feature key must match the runtime feature key.
		const wrongKeyFeature: TDeclaredFeature<TResetFeature> = defineFeature({
			key: 'wrong',
			install<GFeatures extends TCounterFeature[]>(counter: TCounter<GFeatures>) {
				return {
					reset() {
						counter.set(0);
					}
				};
			}
		});

		// @ts-expect-error declared feature API must match the install return value.
		const wrongApiFeature: TDeclaredFeature<TResetFeature> = defineFeature({
			key: 'reset',
			install() {
				return {
					wrong() {
						return undefined;
					}
				};
			}
		});

		// @ts-expect-error declared required features must match runtime requires.
		const wrongRequiredFeature: TDeclaredFeature<TResetTwiceFeature, [TResetFeature]> =
			defineFeature({
				key: 'resetTwice',
				requires: ['logger'] as const,
				install(counter: TCounter<[TResetFeature]>) {
					return {
						resetTwice() {
							counter.reset();
							counter.reset();
						}
					};
				}
			});

		assertType<TDeclaredFeature<TResetFeature>>(wrongKeyFeature);
		assertType<TDeclaredFeature<TResetFeature>>(wrongApiFeature);
		assertType<TDeclaredFeature<TResetTwiceFeature, [TResetFeature]>>(wrongRequiredFeature);
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

function labelFeature(): TDeclaredFeature<TLabelFeature> {
	return defineFeature({
		key: 'label',
		install<GFeatures extends TCounterFeature[]>(counter: TCounter<GFeatures>) {
			return {
				label() {
					return `Count: ${counter.get()}`;
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

function auditFeature(): TDeclaredFeature<TAuditFeature> {
	return defineFeature({
		key: 'audit',
		install<GFeatures extends TCounterFeature[]>(counter: TCounter<GFeatures>) {
			return {
				audit() {
					return counter.get();
				}
			};
		}
	});
}

function inferredConstrainedFeature() {
	return defineFeature({
		key: 'constrained',
		install(counter: TCounter<[TResetFeature]>) {
			return {
				constrained() {
					counter.reset();
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

type TCounterFeature =
	| TResetFeature
	| TResetTwiceFeature
	| TLoggerFeature
	| TLabelFeature
	| TMetaFeature
	| TAuditFeature;

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

interface TLoggerFeature {
	key: 'logger';
	api: {
		log: () => number;
	};
}

interface TLabelFeature {
	key: 'label';
	api: {
		label: () => string;
	};
}

interface TMetaFeature {
	key: 'meta';
	api: Record<never, never>;
}

interface TAuditFeature {
	key: 'audit';
	api: {
		audit: () => number;
	};
}
