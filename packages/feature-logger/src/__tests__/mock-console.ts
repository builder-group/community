import { vi, type MockInstance } from 'vitest';

export function mockConsole(spyOnMethods: TConsoleMethod[], consoleSpies: TConsoleSpies) {
	spyOnMethods.forEach((type) => {
		consoleSpies[type] = vi.spyOn(console, type);
	});
}

export function restoreConsoleMock(consoleSpies: TConsoleSpies) {
	Object.values(consoleSpies).forEach((spy) => {
		spy.mockRestore();
	});
}

export type TConsoleMethod = keyof Console;

export type TConsoleSpies = TSpies<TConsoleMethod[]>;

export type TSpies<T extends readonly string[]> = {
	[K in T[number]]?: MockInstance;
};
