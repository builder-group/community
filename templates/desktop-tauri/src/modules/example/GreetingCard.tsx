import React from 'react';
import { specta } from '@/environment';
import { cn } from '@/lib';

export const GreetingCard: React.FC = () => {
	const [name, setName] = React.useState('Builder');
	const [greeting, setGreeting] = React.useState<specta.GreetingDto | null>(null);

	// MARK: - Actions

	async function handleGreet(): Promise<void> {
		const nextGreeting = await specta.commands.greet(name);
		setGreeting(nextGreeting);
	}

	// MARK: - UI

	const isGreetDisabled = name.trim().length === 0;

	return (
		<section className="mt-12 flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-black/10 bg-white/75 p-5 shadow-sm backdrop-blur">
			<div className="space-y-1">
				<h2 className="text-base font-semibold text-black">Rust command example</h2>
				<p className="text-sm leading-6 text-black/60">
					This button calls a Specta-generated Tauri command and returns a typed response.
				</p>
			</div>

			<label className="flex flex-col gap-2 text-sm font-medium">
				Name
				<input
					className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 transition outline-none focus:border-black/30"
					onChange={(event) => setName(event.target.value)}
					value={name}
				/>
			</label>

			<button
				className={cn(
					'rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/85',
					isGreetDisabled && 'cursor-not-allowed bg-black/40 hover:bg-black/40'
				)}
				disabled={isGreetDisabled}
				onClick={handleGreet}
				type="button"
			>
				Greet From Rust
			</button>

			{greeting != null ? (
				<div className="rounded-xl bg-black/[0.03] p-4 text-sm">
					<p className="font-medium">{greeting.message}</p>
					<p className="mt-1 text-black/50">Source: {greeting.source}</p>
				</div>
			) : null}
		</section>
	);
};
