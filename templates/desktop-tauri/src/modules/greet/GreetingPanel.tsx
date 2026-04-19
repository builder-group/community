import React from 'react';
import { specta } from '@/environment';
import { cn } from '@/lib';

export const GreetingPanel: React.FC = () => {
	const [name, setName] = React.useState('Builder');
	const [greeting, setGreeting] = React.useState<specta.GreetingDto | null>(null);

	// MARK: - Actions

	const handleRustGreeting = React.useCallback(async (): Promise<void> => {
		setGreeting(await specta.commands.greetFromRust(name));
	}, [name]);

	const handleSwiftGreeting = React.useCallback(async (): Promise<void> => {
		setGreeting(await specta.commands.greetFromSwift(name));
	}, [name]);

	// MARK: - UI

	const isGreetingDisabled = name.trim().length === 0;

	return (
		<section className="mt-4 rounded-3xl border border-black/10 bg-white/80 p-4 backdrop-blur-sm">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
				<label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-medium text-black">
					Name
					<input
						className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 transition outline-none focus:border-black/30"
						onChange={(event) => setName(event.target.value)}
						value={name}
					/>
				</label>
				<div className="flex flex-wrap gap-3">
					<button
						className={cn(
							'rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/85',
							isGreetingDisabled && 'cursor-not-allowed bg-black/40 hover:bg-black/40'
						)}
						disabled={isGreetingDisabled}
						onClick={handleRustGreeting}
						type="button"
					>
						Rust
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
						Swift
					</button>
				</div>
			</div>

			{greeting ? (
				<div className="mt-3 rounded-2xl bg-black/5 px-4 py-3 text-sm">
					<p className="font-medium text-black">{greeting.message}</p>
				</div>
			) : null}
		</section>
	);
};
