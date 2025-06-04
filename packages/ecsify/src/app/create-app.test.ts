import { describe, it } from 'vitest';
import { createApp } from './create-app';
import { createDefaultPlugin } from './plugins';

describe('createApp function', () => {
	it('should work', () => {
		const app = createApp({
			plugins: [createDefaultPlugin()] as const,
			systemSets: ['First', 'Update', 'Last']
		});

		app.update();
	});
});
