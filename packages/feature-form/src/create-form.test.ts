import { describe, expect, it } from 'vitest';

import { createForm } from './create-form';

describe('createForm function', () => {
	it('shoudl work', () => {
		const form = createForm({
			fields: {
				item1: {
					initalValue: 10,
					validator: null as any
				},
				item2: {
					initalValue: 'hello',
					validator: null as any
				}
				// item3: {
				// 	initalValue: { nested: 'object' },
				// 	validator: null as any
				// }
			}
		});
		form._value;
		form.listen(() => {
			console.log('Rerender');
		});

		const item2 = form.getField('item2');

		expect(form).not.toBeNull();
	});
});
