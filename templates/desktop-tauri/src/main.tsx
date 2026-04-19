import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { router } from './router';
import './styles.css';

// Expose router for Tauri navigation.
// When Tauri needs to navigate an existing window, it calls:
//   window.__TAURI_ROUTER__.navigate({ href: '/path' })
// This enables SPA navigation without a full page reload.
window.__TAURI_ROUTER__ = router;

declare global {
	interface Window {
		__TAURI_ROUTER__: typeof router;
	}
}

createRoot(document.getElementById('root') as HTMLElement).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>
);
