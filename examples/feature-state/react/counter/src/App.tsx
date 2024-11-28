import { useGlobalState } from 'feature-react/state';
import { $counter } from './store';

export default function App() {
	const counter = useGlobalState($counter);

	return (
		<div>
			<p>{counter}</p>
			<button
				onClick={() => {
					$counter.set((c) => c + 1);
				}}
			>
				+
			</button>
			<button
				onClick={() => {
					$counter.set((c) => c - 1);
				}}
			>
				-
			</button>
			<button
				onClick={() => {
					$counter.undo();
				}}
			>
				Undo
			</button>
			<button
				onClick={() => {
					$counter.set(100);
				}}
			>
				Set 100
			</button>
		</div>
	);
}
