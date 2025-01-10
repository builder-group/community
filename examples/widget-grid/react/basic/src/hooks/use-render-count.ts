import { useEffect, useRef } from 'react';

export function useRenderCount() {
	const renderCount = useRef(0);
	useEffect(() => {
		renderCount.current += 1;
	});
	return renderCount.current;
}
