import React from 'react';

/** Uses layout effect in the browser and regular effect during SSR. */
export const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
