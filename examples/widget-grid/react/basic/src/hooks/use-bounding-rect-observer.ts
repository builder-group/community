import { type TState } from 'feature-state';
import React from 'react';
import { TBoundingRect } from 'widget-grid';

export function useBoundingRectObserver<T extends HTMLElement = HTMLDivElement>(
	ref: React.RefObject<T>,
	rectState: TState<TBoundingRect, []>,
	observeBoundingRect = true
): void {
	const handleBoundingRect = React.useCallback(() => {
		if (ref.current == null) {
			return;
		}

		const prevRect = rectState._v;
		const { left = prevRect.left, top = prevRect.top } = ref.current.getBoundingClientRect();

		if (left !== prevRect.left || top !== prevRect.top) {
			rectState.set({ left, top });
		}
	}, [rectState, ref]);

	React.useEffect(() => {
		let mutationObserver: MutationObserver | null = null;
		if (observeBoundingRect && ref.current != null) {
			mutationObserver = new MutationObserver(() => {
				handleBoundingRect();
			});
			mutationObserver.observe(ref.current, { attributes: true, childList: true, subtree: true });
			handleBoundingRect();
		}

		return () => {
			mutationObserver?.disconnect();
		};
	}, [ref, observeBoundingRect, handleBoundingRect]);
}
