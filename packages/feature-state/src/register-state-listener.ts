import type { TListener, TListenerCallback, TStateBase } from './types';

/**
 * Registers a listener and manages first-listener connection and last-listener cleanup.
 * Calls `onUnsubscribe` before removing the listener. Repeated unsubscribe calls do nothing.
 */
export function registerStateListener<GValue>(
	state: TStateBase<GValue>,
	listener: TListener<GValue>,
	onUnsubscribe: (callback: TListenerCallback<GValue>) => void
): () => void {
	if (!state._listeners.length) {
		state._listenerLifecycle?.connect();
	}
	state._listeners.push(listener);

	return () => {
		const index = state._listeners.indexOf(listener);
		if (index === -1) {
			return;
		}
		onUnsubscribe(listener.callback);
		state._listeners.splice(index, 1);
		if (!state._listeners.length) {
			state._listenerLifecycle?.disconnect();
		}
	};
}
