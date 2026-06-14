import { platform } from '@tauri-apps/plugin-os';
import React from 'react';

export function usePlatform() {
	return React.useMemo(() => platform(), []);
}
