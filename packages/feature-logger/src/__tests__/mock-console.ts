import { vi, type MockInstance } from 'vitest';

export function mockConsole(methods: TConsoleMethod[], consoleSpies: TConsoleSpies): void {
	for (const method of methods) {
		consoleSpies[method] = vi.spyOn(console, method).mockImplementation(() => undefined);
	}
}

export function restoreConsoleMock(consoleSpies: TConsoleSpies): void {
	for (const spy of Object.values(consoleSpies)) {
		spy.mockRestore();
	}
}

export type TConsoleMethod = 'debug' | 'trace' | 'log' | 'info' | 'warn' | 'error';

export type TConsoleSpies = Partial<Record<TConsoleMethod, MockInstance>>;
