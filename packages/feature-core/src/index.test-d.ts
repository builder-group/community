import { assertType, describe, expectTypeOf, it } from 'vitest';
import {
	createFeatureHost,
	defineFeature,
	hasFeature,
	installFeature,
	type TAnyFeature,
	type TFeature,
	type TFeatureHost,
	type TInstalledFeaturesOf
} from './index';

describe('feature-core types', () => {
	describe('createFeatureHost types', () => {
		it('should preserve the base API and expose an empty feature tuple', () => {
			const counter = createCounter(0);

			assertType<number>(counter.get());
			expectTypeOf(counter).toEqualTypeOf<TCounter<[]>>();
		});
	});

	describe('defineFeature types', () => {
		it('should infer feature keys and APIs without an explicit feature type', () => {
			const feature = inferredFeature();
			const counter = createCounter(0).with(feature);

			assertType<TFeature<'inferred', { inferred(): boolean }>>(feature);
			assertType<boolean>(counter.inferred());
		});

		it('should type the install host from required feature APIs', () => {
			const feature = defineFeature<TResetTwiceFeature>({
				key: 'resetTwice',
				requires: ['reset'],
				install(counter) {
					assertType<() => void>(counter.reset);

					return {
						resetTwice() {
							counter.reset();
							counter.reset();
						}
					};
				}
			});

			assertType<TResetTwiceFeature>(feature);
		});

		it('should allow dependent features to annotate a full host when base APIs are needed', () => {
			const feature = defineFeature<TResetAndReadFeature>({
				key: 'resetAndRead',
				requires: ['reset'],
				install(counter: TCounter<[TResetFeature]>) {
					assertType<number>(counter.get());
					assertType<() => void>(counter.reset);

					return {
						resetAndRead() {
							counter.reset();

							return counter.get();
						}
					};
				}
			});

			assertType<TResetAndReadFeature>(feature);
		});

		it('should reject a runtime key that does not match the declared feature', () => {
			defineFeature<TResetFeature>({
				// @ts-expect-error declared feature key must match the runtime feature key.
				key: 'wrong',
				install(counter: TCounterBase) {
					return {
						reset() {
							counter.set(0);
						}
					};
				}
			});
		});

		it('should reject an API that does not match the declared feature', () => {
			defineFeature<TResetFeature>({
				key: 'reset',
				// @ts-expect-error declared feature API must match the install return value.
				install() {
					return {
						wrong() {
							return undefined;
						}
					};
				}
			});
		});

		it('should reject a required key that is not declared by the feature', () => {
			defineFeature<TResetTwiceFeature>({
				key: 'resetTwice',
				// @ts-expect-error declared required feature keys must match runtime requires.
				requires: ['logger'],
				install() {
					return { resetTwice() {} };
				}
			});
		});

		it('should reject missing required feature keys', () => {
			defineFeature<TResetLoggerFeature>({
				key: 'resetLogger',
				// @ts-expect-error every declared required feature key must be listed.
				requires: ['reset'],
				install(counter) {
					return {
						resetLogger() {
							counter.reset();
							counter.log();
						}
					};
				}
			});
		});

		it('should reject required feature keys in the wrong order', () => {
			defineFeature<TResetLoggerFeature>({
				key: 'resetLogger',
				// @ts-expect-error requires mirrors the declared required feature tuple.
				requires: ['logger', 'reset'],
				install(counter) {
					return {
						resetLogger() {
							counter.reset();
							counter.log();
						}
					};
				}
			});
		});
	});

	describe('installFeature types', () => {
		it('should append an installed feature to the host tuple', () => {
			const counter = installFeature(createCounter(0), resetFeature());

			assertType<() => void>(counter.reset);
			expectTypeOf(counter).toEqualTypeOf<TCounter<[TResetFeature]>>();
		});

		it('should reject a feature with missing dependencies', () => {
			const counter = createCounter(0);

			// @ts-expect-error resetTwiceFeature requires resetFeature first.
			installFeature(counter, resetTwiceFeature());
		});

		it('should reject a feature key that is already installed', () => {
			const counter = createCounter(0).with(resetFeature());

			// @ts-expect-error resetFeature is already installed.
			installFeature(counter, resetFeature());
		});
	});

	describe('host.with types', () => {
		it('should infer chained feature order', () => {
			const counter = createCounter(0)
				.with(resetFeature())
				.with(resetTwiceFeature())
				.with(loggerFeature());

			assertType<number>(counter.log());
			expectTypeOf(counter.resetTwice).returns.toBeVoid();
			expectTypeOf(counter).toEqualTypeOf<
				TCounter<[TResetFeature, TResetTwiceFeature, TLoggerFeature]>
			>();
		});

		it('should infer variadic feature order', () => {
			const counter = createCounter(0).with(
				resetFeature(),
				resetTwiceFeature(),
				loggerFeature(),
				labelFeature(),
				metaFeature(),
				auditFeature()
			);

			assertType<string>(counter.label());
			assertType<number>(counter.audit());
			expectTypeOf(counter._features).toEqualTypeOf<
				readonly ('reset' | 'resetTwice' | 'logger' | 'label' | 'meta' | 'audit')[]
			>();
		});

		it('should extract the installed feature tuple from a host type', () => {
			const counter = createCounter(0)
				.with(resetFeature())
				.with(resetTwiceFeature())
				.with(loggerFeature());

			assertType<number>(counter.log());
			expectTypeOf<TInstalledFeaturesOf<typeof counter>>().toEqualTypeOf<
				[TResetFeature, TResetTwiceFeature, TLoggerFeature]
			>();
		});

		it('should reject unavailable APIs before their feature is installed', () => {
			const counter = createCounter(0);

			// @ts-expect-error reset is not available before resetFeature is installed.
			counter.reset();
		});

		it('should reject missing dependencies in install order', () => {
			const counter = createCounter(0);

			// @ts-expect-error resetTwiceFeature requires resetFeature first.
			counter.with(resetTwiceFeature());
		});

		it('should reject a feature key that is already installed in a later chain call', () => {
			const counter = createCounter(0).with(resetFeature());

			// @ts-expect-error resetFeature is already installed.
			counter.with(resetFeature());
		});

		it('should reject a feature key that is repeated in the same variadic call', () => {
			const counter = createCounter(0);

			// @ts-expect-error resetFeature is already installed earlier in the same call.
			counter.with(resetFeature(), resetFeature());
		});

		it('should allow installing a feature on a broadly typed host', () => {
			const counter = createCounter(0) as TFeatureHost<TCounterBase, TAnyFeature[]>;
			const counterWithReset = counter.with(resetFeature());

			assertType<readonly string[]>(counterWithReset._features);
		});

		it('should expose readonly feature metadata', () => {
			const counter = createCounter(0);

			// @ts-expect-error _features is visible but readonly.
			counter._features.push('reset');
		});
	});

	describe('hasFeature types', () => {
		it('should narrow a matching feature key capability', () => {
			const counter = createCounter(0).with(loggerFeature());
			const unknownCounter: unknown = counter;

			if (hasFeature<TLoggerFeature>(unknownCounter, 'logger')) {
				assertType<number>(unknownCounter.log());
			}
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

function labelFeature(): TLabelFeature {
	return defineFeature<TLabelFeature>({
		key: 'label',
		install(counter: TCounterBase) {
			return {
				label() {
					return `Count: ${counter.get()}`;
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

function auditFeature(): TAuditFeature {
	return defineFeature<TAuditFeature>({
		key: 'audit',
		install(counter: TCounterBase) {
			return {
				audit() {
					return counter.get();
				}
			};
		}
	});
}

function inferredFeature() {
	return defineFeature({
		key: 'inferred',
		install() {
			return {
				inferred() {
					return true;
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

type TResetFeature = TFeature<'reset', { reset(): void }>;
type TResetTwiceFeature = TFeature<'resetTwice', { resetTwice(): void }, [TResetFeature]>;
type TResetAndReadFeature = TFeature<'resetAndRead', { resetAndRead(): number }, [TResetFeature]>;
type TResetLoggerFeature = TFeature<
	'resetLogger',
	{ resetLogger(): void },
	[TResetFeature, TLoggerFeature]
>;
type TLoggerFeature = TFeature<'logger', { log(): number }>;
type TLabelFeature = TFeature<'label', { label(): string }>;
type TMetaFeature = TFeature<'meta', Record<never, never>>;
type TAuditFeature = TFeature<'audit', { audit(): number }>;

type TCounterFeature =
	| TResetFeature
	| TResetTwiceFeature
	| TResetAndReadFeature
	| TLoggerFeature
	| TLabelFeature
	| TMetaFeature
	| TAuditFeature;
