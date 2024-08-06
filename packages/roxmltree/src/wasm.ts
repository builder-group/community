import init, { type InitInput } from '@/rust/roxmltree-api';
import wasm from '@/rust/roxmltree-api/bg.wasm';

export * from '@/rust/roxmltree-api';
export * from '@/rust/roxmltree-api/bindings';

export async function initWasm(): Promise<void> {
	// https://www.npmjs.com/package/@rollup/plugin-wasm#using-with-wasm-bindgen-and-wasm-pack
	// @ts-expect-error - Needs to be loaded async
	const wasmInstance: InitInput = await wasm();
	await init(wasmInstance);
}
