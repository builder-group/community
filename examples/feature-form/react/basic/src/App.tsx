import { createForm, createValidator, TFormFieldValidator, valibotValidator } from 'feature-form';
import { useForm } from 'feature-react/form';
import { withGlobalBind } from 'feature-react/state';
import { maxLength, minLength, pipe, regex, string } from 'valibot';

import './App.css';

import { StatusMessage } from './components';

type TFormData = {
	// [key: string]: string; // https://stackoverflow.com/questions/65799316/why-cant-an-interface-be-assigned-to-recordstring-unknown
	firstName: string;
	lastName: string;
	gender: 'Male' | 'Female';
	// userName: string;
	// email: string;
	// aboutYou: string;
	// image: {
	// 	id: string;
	// 	color: string;
	// };
};

const nameValidator = valibotValidator(
	pipe(string(), minLength(2), maxLength(10), regex(/^([^0-9]*)$/))
);

let renderCount = 0;

const $form = withGlobalBind(
	'_form',
	createForm<TFormData>({
		fields: {
			firstName: {
				validator: nameValidator,
				defaultValue: ''
			},
			lastName: {
				validator: nameValidator.clone().append(
					createValidator([
						{
							key: 'jeff',
							validate: (formField) => {
								if (formField.get()?.includes('Jeff')) {
									formField.status.registerNextError({
										code: 'jeff-not-allowed',
										message: 'Jeff is not allowed!'
									});
								}
							}
						}
					])
				),
				defaultValue: ''
			},
			gender: {
				validator: valibotValidator(string()) as TFormFieldValidator<'Male' | 'Female'>,
				defaultValue: 'Female'
			}
		},
		onSubmit: (data) => {
			console.log('Submit', data);
		},
		notifyOnStatusChange: false,
		validateMode: 'onChange',
		reValidateMode: 'onChange'
	})
);

$form.getField('firstName').status.listen((props) => {
	console.log('Change Field', props);
});

function App() {
	const { submit, status, field, register } = useForm($form);

	renderCount++;

	return (
		<form>
			<h1>Sign Up</h1>

			<label>First Name:</label>
			<input {...register('firstName')} />
			<StatusMessage $status={status('firstName')} />

			<label>Last Name:</label>
			<input {...register('lastName')} />
			<StatusMessage $status={status('lastName')} />

			<label>Gender</label>
			<select
				defaultValue={''}
				onChange={(e) =>
					field('gender').set(e.target.value as any, { listenerData: { background: true } })
				}
			>
				<option value={''}>Select...</option>
				<option value="male">Male</option>
				<option value="female">Female</option>
			</select>
			<StatusMessage $status={status('gender')} />

			<button
				onClick={async (event) => {
					event.preventDefault();
					await submit();
				}}
			>
				Submit
			</button>
			<p>Is Valid: {$form.isValid.toString()}</p>
			<p>Render Count: {renderCount}</p>
		</form>
	);
}

export default App;
