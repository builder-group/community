import { platform } from '@tauri-apps/plugin-os';

export function usePlatform() {
	return platform();
}
