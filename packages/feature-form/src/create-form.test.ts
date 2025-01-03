import { TState, withUndo } from 'feature-state';
import { createValidator } from 'validation-adapter';
import { describe, expect, it } from 'vitest';
import { createForm } from './create-form';
import { fromValidator } from './helper';
import { TFormFieldStateFeature } from './types';

describe('createForm function', () => {
	it('should have correct types', async () => {
		const $form = createForm({
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

		const item5 = $form.getField('item5');
		item5.set('jeff');

		await $form.submit();
		$form.reset();

		// TODO: Should be extendable with Undo feature,
		// but seems to only work if State definition is top level
		const $item5: TState<string | undefined, [TFormFieldStateFeature<string>]> =
			$form.getField('item5');
		$item5.isSubmitted;
		const $item5Undo = withUndo($item5);
		$item5Undo.undo();
		$item5Undo.isSubmitted;

		expect($form).not.toBeNull();
	});
});
