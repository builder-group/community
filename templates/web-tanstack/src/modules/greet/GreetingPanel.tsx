import React from 'react';
import { cn } from '@/lib';
import { greetFromTypeScript } from './greet';

export const GreetingPanel: React.FC = () => {
	const [name, setName] = React.useState('Builder');
	const [greeting, setGreeting] = React.useState<string | null>(null);

	// MARK: - Actions

	const handleTypeScriptGreeting = React.useCallback(() => {
		setGreeting(greetFromTypeScript(name));
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
						onClick={handleTypeScriptGreeting}
						type="button"
					>
						TypeScript
					</button>
				</div>
			</div>

			{greeting ? (
				<div className="mt-3 rounded-2xl bg-black/5 px-4 py-3 text-sm">
					<p className="font-medium text-black">{greeting}</p>
				</div>
			) : null}
		</section>
	);
};
