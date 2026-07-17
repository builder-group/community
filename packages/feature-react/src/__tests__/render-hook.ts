import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

// Note: React checks this flag before trusting act() in custom test renderers
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export function renderHook<GResult>(useHook: () => GResult): TRenderedHook<GResult> {
	let result: TRenderHookResult<GResult> = { hasRendered: false };
	const container = document.createElement('div');
	const root = createRoot(container);
	let isMounted = true;

	document.body.append(container);

	const HookHost: React.FC = () => {
		// Store the hook result during render so tests can inspect the latest value
		result = { hasRendered: true, value: useHook() };
		return null;
	};

	function render(): void {
		act(() => {
			root.render(React.createElement(HookHost));
		});
	}

	function unmount(): void {
		if (!isMounted) {
			return;
		}

		isMounted = false;
		act(() => {
			root.unmount();
		});
		container.remove();
	}

	render();
	hookCleanups.push(unmount);

	return {
		get result() {
			if (!result.hasRendered) {
				throw new Error('Hook did not return a result');
			}

			return result.value;
		},
		rerender: render,
		unmount
	};
}

const hookCleanups: Array<() => void> = [];

type TRenderHookResult<GResult> =
	{ readonly hasRendered: false } | { readonly hasRendered: true; readonly value: GResult };

export interface TRenderedHook<GResult> {
	readonly result: GResult;
	rerender(): void;
	unmount(): void;
}

export function cleanupRenderedHooks(): void {
	for (const cleanup of hookCleanups.splice(0)) {
		cleanup();
	}
}
