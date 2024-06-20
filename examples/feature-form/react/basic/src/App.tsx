import { createForm, valibotValidator } from 'feature-form';
import { useForm } from 'feature-react/form';
import { withGlobalBind } from 'feature-react/state';
import { maxLength, minLength, pipe, regex, string } from 'valibot';

import './App.css';

import { StatusMessage } from './components';

interface TFormData {
	[key: string]: string; // https://stackoverflow.com/questions/65799316/why-cant-an-interface-be-assigned-to-recordstring-unknown
	firstName: string;
	// lastName: string;
	// gender: 'Male' | 'Female';
	// userName: string;
	// email: string;
	// aboutYou: string;
	// image: {
	// 	id: string;
	// 	color: string;
	// };
}

let renderCount = 0;

const $form = withGlobalBind(
	'_form',
	createForm<TFormData>({
		fields: {
			firstName: {
				validator: valibotValidator(
					pipe(string(), minLength(2), maxLength(10), regex(/^([^0-9]*)$/))
				),
				defaultValue: ''
			}
		},
		notifyOnStatusChange: false
	})
);

function App() {
	const { submit, status, register } = useForm($form);

	renderCount++;

	return (
		<form>
			<h1>Sign Up</h1>
			<label>First Name:</label>
			<input {...register('firstName')} />
			<StatusMessage $status={status('firstName')} />
			<button
				onClick={async (event) => {
					event.preventDefault();
					console.log($form);
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
