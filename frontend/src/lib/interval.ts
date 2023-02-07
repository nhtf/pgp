import { onDestroy } from 'svelte';

export function onInterval(callback: any, milliseconds: number) {
	const interval = setInterval(callback, milliseconds);

	onDestroy(() => {
		clearInterval(interval);
	});
}