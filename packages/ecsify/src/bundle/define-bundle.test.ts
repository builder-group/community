import { describe, expect, it } from 'vitest';
import { bundleEntry, defineBundle } from './define-bundle';

describe('defineBundle', () => {
	it('flattens nested bundles into a single bundle', () => {
		const Position = { x: [] as number[], y: [] as number[] };
		const Health = [] as number[];
		const Player = {};

		const actorBundle = defineBundle(
			bundleEntry(Position, { x: 10, y: 20 }),
			bundleEntry(Health, 100)
		);
		const playerBundle = defineBundle(actorBundle, bundleEntry(Player));

		expect(playerBundle).toEqual([
			{ component: Position, value: { x: 10, y: 20 } },
			{ component: Health, value: 100 },
			{ component: Player, value: undefined }
		]);
	});

	it('throws when the same component appears more than once', () => {
		const Health = [] as number[];

		expect(() =>
			defineBundle(bundleEntry(Health, 100), defineBundle(bundleEntry(Health, 50)))
		).toThrow('Bundle contains duplicate component references');
	});
});
