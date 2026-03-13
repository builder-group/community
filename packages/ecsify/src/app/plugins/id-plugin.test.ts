import { describe, expect, it } from 'vitest';
import { createApp } from '../create-app';
import { createDefaultPlugin } from './default-plugin';
import { createIdPlugin } from './id-plugin';

describe('createIdPlugin function', () => {
	it('should create plugin that can be added to app', () => {
		const app = createApp({
			plugins: [createDefaultPlugin(), createIdPlugin()] as const,
			systemSets: ['First', 'Update', 'Last', 'Flush']
		});

		expect(app.c.IdMixin).toBeDefined();
		expect(app.r.idMap).toBeInstanceOf(Map);
		expect(app.getEntityById).toBeDefined();
	});

	it('should map entity to ID when component is added', () => {
		const app = createApp({
			plugins: [createDefaultPlugin(), createIdPlugin()] as const,
			systemSets: ['First', 'Update', 'Last', 'Flush']
		});

		const eid = app.createEntity();
		app.addComponent(eid, app.c.IdMixin, { id: 'player1' });

		expect(app.r.idMap.get('player1')).toBe(eid);
	});

	it('should unmap entity when component is removed', () => {
		const app = createApp({
			plugins: [createDefaultPlugin(), createIdPlugin()] as const,
			systemSets: ['First', 'Update', 'Last', 'Flush']
		});

		const eid = app.createEntity();
		app.addComponent(eid, app.c.IdMixin, { id: 'player1' });

		expect(app.r.idMap.get('player1')).toBe(eid);

		app.removeComponent(eid, app.c.IdMixin);

		expect(app.r.idMap.has('player1')).toBe(false);
	});

	it('should handle multiple entities with different IDs', () => {
		const app = createApp({
			plugins: [createDefaultPlugin(), createIdPlugin()] as const,
			systemSets: ['First', 'Update', 'Last', 'Flush']
		});

		const eid1 = app.createEntity();
		const eid2 = app.createEntity();
		const eid3 = app.createEntity();

		app.addComponent(eid1, app.c.IdMixin, { id: 'player1' });
		app.addComponent(eid2, app.c.IdMixin, { id: 'enemy1' });
		app.addComponent(eid3, app.c.IdMixin, { id: 123 });

		expect(app.r.idMap.get('player1')).toBe(eid1);
		expect(app.r.idMap.get('enemy1')).toBe(eid2);
		expect(app.r.idMap.get(123)).toBe(eid3);
		expect(app.r.idMap.size).toBe(3);
	});

	it('should handle ID updates correctly', () => {
		const app = createApp({
			plugins: [createDefaultPlugin(), createIdPlugin()] as const,
			systemSets: ['First', 'Update', 'Last', 'Flush']
		});

		const eid = app.createEntity();
		app.addComponent(eid, app.c.IdMixin, { id: 'oldId' });

		expect(app.r.idMap.get('oldId')).toBe(eid);

		// Remove old ID and add new one
		app.removeComponent(eid, app.c.IdMixin);
		app.addComponent(eid, app.c.IdMixin, { id: 'newId' });

		expect(app.r.idMap.has('oldId')).toBe(false);
		expect(app.r.idMap.get('newId')).toBe(eid);
	});

	describe('getEntityById', () => {
		it('should return entity ID for existing ID', () => {
			const app = createApp({
				plugins: [createDefaultPlugin(), createIdPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
			});

			const eid = app.createEntity();
			app.addComponent(eid, app.c.IdMixin, { id: 'player1' });

			expect(app.getEntityById('player1')).toBe(eid);
		});

		it('should return null for non-existent ID', () => {
			const app = createApp({
				plugins: [createDefaultPlugin(), createIdPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
			});

			expect(app.getEntityById('nonExistent')).toBe(null);
		});

		it('should return null after entity ID is removed', () => {
			const app = createApp({
				plugins: [createDefaultPlugin(), createIdPlugin()] as const,
				systemSets: ['First', 'Update', 'Last', 'Flush']
			});

			const eid = app.createEntity();
			app.addComponent(eid, app.c.IdMixin, { id: 'player1' });

			expect(app.getEntityById('player1')).toBe(eid);

			app.removeComponent(eid, app.c.IdMixin);

			expect(app.getEntityById('player1')).toBe(null);
		});
	});
});
