import { createValidator } from 'validation-adapter';
import { describe, expect, it } from 'vitest';
import { createForm } from './create-form';
import { fromValidator } from './helper';

describe('createForm function', () => {
	it('shoudl work', async () => {
		const form = createForm({
			fields: {
				item5: fromValidator<string>(
					createValidator([
						{
							key: 'length',
							validate: (cx) => {
								if (typeof cx.value === 'string' && cx.value.length < 5) {
									cx.registerError({ code: 'LENGTH' });
								}
							}
						}
					]),
					{
						defaultValue: ''
					}
				)
			}
		});

		const item5 = form.getField('item5');
		item5.set('jeff');

		await form.submit();

		form.reset();

		expect(form).not.toBeNull();
	});
});
