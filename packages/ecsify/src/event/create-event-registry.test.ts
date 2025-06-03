import { beforeEach, describe, expect, it } from 'vitest';
import { createEventRegistry, TEventRegistry } from './create-event-registry';

describe('createEventRegistry', () => {
	type TestEvents = {
		playerMove: { x: number; y: number };
		playerAttack: { damage: number; target: string };
		gameStart: { level: number };
		simpleEvent: string;
	};

	let eventRegistry: TEventRegistry<TestEvents>;

	beforeEach(() => {
		eventRegistry = createEventRegistry<TestEvents>();
	});

	describe('push', () => {
		it('should push a single event', () => {
			eventRegistry.push('playerMove', { x: 10, y: 20 });

			const events = eventRegistry.read('playerMove');
			expect(events).toHaveLength(1);
			expect(events[0]?.type).toBe('playerMove');
			expect(events[0]?.data).toEqual({ x: 10, y: 20 });
			expect(typeof events[0]?.timestamp).toBe('number');
		});

		it('should push multiple events of same type', () => {
			eventRegistry.push('playerMove', { x: 10, y: 20 });
			eventRegistry.push('playerMove', { x: 15, y: 25 });

			const events = eventRegistry.read('playerMove');
			expect(events).toHaveLength(2);
			expect(events[0]?.data).toEqual({ x: 10, y: 20 });
			expect(events[1]?.data).toEqual({ x: 15, y: 25 });
		});

		it('should push events of different types', () => {
			eventRegistry.push('playerMove', { x: 10, y: 20 });
			eventRegistry.push('playerAttack', { damage: 50, target: 'enemy1' });

			const moveEvents = eventRegistry.read('playerMove');
			const attackEvents = eventRegistry.read('playerAttack');

			expect(moveEvents).toHaveLength(1);
			expect(attackEvents).toHaveLength(1);
			expect(moveEvents[0]?.data).toEqual({ x: 10, y: 20 });
			expect(attackEvents[0]?.data).toEqual({ damage: 50, target: 'enemy1' });
		});

		it('should set timestamp on pushed events', () => {
			const beforeTime = Date.now();
			eventRegistry.push('gameStart', { level: 1 });
			const afterTime = Date.now();

			const events = eventRegistry.read('gameStart');
			expect(events[0]?.timestamp).toBeGreaterThanOrEqual(beforeTime);
			expect(events[0]?.timestamp).toBeLessThanOrEqual(afterTime);
		});
	});

	describe('read', () => {
		it('should return empty array for non-existent event type', () => {
			const events = eventRegistry.read('playerMove');
			expect(events).toEqual([]);
		});

		it('should read events without consuming them', () => {
			eventRegistry.push('playerMove', { x: 10, y: 20 });

			const events1 = eventRegistry.read('playerMove');
			const events2 = eventRegistry.read('playerMove');

			expect(events1).toHaveLength(1);
			expect(events2).toHaveLength(1);
			expect(events1[0]).toEqual(events2[0]);
		});

		it('should return all events of specified type', () => {
			eventRegistry.push('playerMove', { x: 10, y: 20 });
			eventRegistry.push('playerMove', { x: 15, y: 25 });
			eventRegistry.push('playerAttack', { damage: 50, target: 'enemy1' });

			const moveEvents = eventRegistry.read('playerMove');
			expect(moveEvents).toHaveLength(2);
			expect(moveEvents[0]?.data).toEqual({ x: 10, y: 20 });
			expect(moveEvents[1]?.data).toEqual({ x: 15, y: 25 });
		});
	});

	describe('consume', () => {
		it('should return empty array for non-existent event type', () => {
			const events = eventRegistry.consume('playerMove');
			expect(events).toEqual([]);
		});

		it('should consume events (read and clear)', () => {
			eventRegistry.push('playerMove', { x: 10, y: 20 });
			eventRegistry.push('playerMove', { x: 15, y: 25 });

			const consumedEvents = eventRegistry.consume('playerMove');
			const remainingEvents = eventRegistry.read('playerMove');

			expect(consumedEvents).toHaveLength(2);
			expect(remainingEvents).toHaveLength(0);
			expect(consumedEvents[0]?.data).toEqual({ x: 10, y: 20 });
			expect(consumedEvents[1]?.data).toEqual({ x: 15, y: 25 });
		});

		it('should only clear events of specified type', () => {
			eventRegistry.push('playerMove', { x: 10, y: 20 });
			eventRegistry.push('playerAttack', { damage: 50, target: 'enemy1' });

			eventRegistry.consume('playerMove');
			const attackEvents = eventRegistry.read('playerAttack');

			expect(attackEvents).toHaveLength(1);
			expect(attackEvents[0]?.data).toEqual({ damage: 50, target: 'enemy1' });
		});

		it('should return events in order they were pushed', () => {
			eventRegistry.push('playerMove', { x: 10, y: 20 });
			eventRegistry.push('playerMove', { x: 15, y: 25 });
			eventRegistry.push('playerMove', { x: 30, y: 35 });

			const events = eventRegistry.consume('playerMove');

			expect(events).toHaveLength(3);
			expect(events[0]?.data).toEqual({ x: 10, y: 20 });
			expect(events[1]?.data).toEqual({ x: 15, y: 25 });
			expect(events[2]?.data).toEqual({ x: 30, y: 35 });
		});

		it('should allow consuming same type multiple times', () => {
			eventRegistry.push('playerMove', { x: 10, y: 20 });
			const firstConsume = eventRegistry.consume('playerMove');
			const secondConsume = eventRegistry.consume('playerMove');

			expect(firstConsume).toHaveLength(1);
			expect(secondConsume).toHaveLength(0);
		});
	});

	describe('flush', () => {
		it('should clear all events', () => {
			eventRegistry.push('playerMove', { x: 10, y: 20 });
			eventRegistry.push('playerAttack', { damage: 50, target: 'enemy1' });
			eventRegistry.push('gameStart', { level: 1 });

			eventRegistry.flush();

			expect(eventRegistry.read('playerMove')).toEqual([]);
			expect(eventRegistry.read('playerAttack')).toEqual([]);
			expect(eventRegistry.read('gameStart')).toEqual([]);
		});
	});
});
