import { createState, type TListenerCallback, type TState } from 'feature-state';

export function createTrackedState<GValue>(value: GValue): TTrackedState<GValue> {
	const $state = createState(value) as TTrackedState<GValue>;
	const listen = $state.listen.bind($state);
	$state.listenCount = 0;
	$state.unlistenCount = 0;
	$state.listen = (callback) => {
		$state.listenCount++;
		const unlisten = listen(callback);
		return () => {
			$state.unlistenCount++;
			unlisten();
		};
	};

	return $state;
}

export interface TTrackedState<GValue> extends TState<GValue> {
	listenCount: number;
	unlistenCount: number;
	listen(callback: TListenerCallback<GValue>): () => void;
}
