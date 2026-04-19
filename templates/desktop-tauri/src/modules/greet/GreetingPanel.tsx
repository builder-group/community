import React from 'react';
import { specta } from '@/environment';
import { cn } from '@/lib';

export const GreetingPanel: React.FC = () => {
	const [name, setName] = React.useState('Builder');
	const [rustGreeting, setRustGreeting] = React.useState<specta.GreetingDto | null>(null);
	const [swiftGreeting, setSwiftGreeting] = React.useState<specta.GreetingDto | null>(null);

	// MARK: - Actions

	const handleRustGreeting = React.useCallback(async (): Promise<void> => {
		setRustGreeting(await specta.commands.greetFromRust(name));
	}, [name]);

	const handleSwiftGreeting = React.useCallback(async (): Promise<void> => {
		setSwiftGreeting(await specta.commands.greetFromSwift(name));
	}, [name]);

	// MARK: - UI

	const isGreetingDisabled = name.trim().length === 0;

	return (
		<section className="mt-8 rounded-3xl border border-black/10 bg-white/80 p-6 backdrop-blur-sm">
			<div className="space-y-1">
				<h2 className="text-lg font-semibold text-black">Greetings</h2>
				<p className="text-sm leading-6 text-black/60">
					Use one typed Specta command backed by Rust and another backed by Swift.
				</p>
			</div>

			<label className="mt-5 flex flex-col gap-2 text-sm font-medium text-black">
				Name
				<input
					className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 transition outline-none focus:border-black/30"
					onChange={(event) => setName(event.target.value)}
					value={name}
				/>
			</label>

			<div className="mt-4 flex flex-wrap gap-3">
				<button
					className={cn(
						'rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/85',
						isGreetingDisabled && 'cursor-not-allowed bg-black/40 hover:bg-black/40'
					)}
					disabled={isGreetingDisabled}
					onClick={handleRustGreeting}
					type="button"
				>
					Greet From Rust
				</button>
				<button
					className={cn(
						'rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90',
						isGreetingDisabled && 'cursor-not-allowed opacity-50 hover:bg-white/70'
					)}
					disabled={isGreetingDisabled}
					onClick={handleSwiftGreeting}
					type="button"
				>
					Greet From Swift
				</button>
			</div>

			<div className="mt-5 space-y-3 text-sm">
				{rustGreeting ? (
					<div className="rounded-2xl bg-black/3 px-4 py-3">
						<p className="font-medium text-black">{rustGreeting.message}</p>
						<p className="mt-1 text-black/50">Source: {rustGreeting.source}</p>
					</div>
				) : null}
				{swiftGreeting ? (
					<div className="rounded-2xl bg-black/3 px-4 py-3">
						<p className="font-medium text-black">{swiftGreeting.message}</p>
						<p className="mt-1 text-black/50">Source: {swiftGreeting.source}</p>
					</div>
				) : null}
			</div>
		</section>
	);
};
