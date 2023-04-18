<script lang="ts">
	import type { Suggestion } from "$lib/types";
	import { icon_path } from "$lib/constants";
	import { get } from "$lib/Web";

	export let callback: (content: string) => void;
	export let disabled: boolean = false;

	//http://alistapart.com/article/expanding-text-areas-made-elegant/
	const send_icon = `${icon_path}/send.svg`;

	export let content = "";
	// let timer: NodeJs.Timeout;
	let timer: number;
	let suggestions: Suggestion[] = [];
	let last_command: command | null = null;
	
	type command = {
		command: string,
		onExecute: (input: string, setInput: (value: string) => void) => void,
		onInput: (input: string) => void,
		onClear: () => void,
	};
	const commands = [
		{
			command: "tenor",
			onExecute: onTenorExecute,
			onInput: onTenorInput,
			onClear: onTenorClear,
		},
		{
			command: "giphy",
			onExecute: onGiphyExecute,
			onInput: onGiphyInput,
			onClear: onTenorClear,
		},
	];
	async function onGiphyInput(input: string) {
		clearTimeout(timer);
		if (!input)
			suggestions = [];
		timer = setTimeout(async () => {
			suggestions = await getSuggestions("giphy", input);
		}, 1000);
	}

	async function onGiphyExecute(input: string, setInput: (string: string) => void) {
		clearTimeout(timer);
		const tmp = await getSuggestions("giphy", input);
		setInput(tmp[0].url);
	}

	async function onTenorInput(input: string) {
		clearTimeout(timer);
		if (!input)
			suggestions = [];
		timer = setTimeout(async () => {
			suggestions = await getSuggestions("tenor",input);
		}, 1000);
	}

	async function onTenorExecute(input: string, setInput: (string: string) => void) {
		clearTimeout(timer);
		const tmp = await getSuggestions("tenor", input);
		setInput(tmp[0].url);
	}

	function onTenorClear() {
		clearTimeout(timer);
		suggestions = [];
	}

	async function getSuggestions(which: "tenor" | "giphy", query: string) {
		return get(`/media/${which}`, { query });
	}

	async function onKeyPress(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			const command = commands.find((command) => content.startsWith(`/${command.command} `));
			if (command) {
				await command.onExecute(content.slice(content.indexOf(' ') + 1), (new_input: string) => {
					content = new_input;
				});
				last_command = null;
			} else {
				sendMessage();
			}
		}
	}

	$: {
		const command = commands.find((command) => content.startsWith(`/${command.command} `));
		if (command) {
			last_command = command;
			const res = command.onInput(content.slice(content.indexOf(' ') + 1));
			if (res instanceof Promise) {
				res.then((_) => {});
			}
		} else if (last_command) {
			last_command.onClear();
			last_command = null;
		}
	}

	function apply(url: string) {
		content = url;
		suggestions = [];
	}

	async function sendMessage() {
		if (content.length) {
			callback(content);

			content = "";
		}
	}
</script>

{#if suggestions.length}
	<div class="suggestion-container">
		{#each suggestions as { src, url, desc }}
			<img
				class="suggestion"
				on:click={() => apply(url)}
				on:keypress={() => apply(url)}
				alt={desc}
				src={src}
			/>
		{/each}
	</div>
{/if}

<div class="text-container">
	<div class="input-container">
		<pre aria-hidden="true">&zwnj;{`${content}\n`}</pre>
		<textarea
			disabled={disabled || false}
			on:keypress={onKeyPress}
			bind:value={content}
			placeholder={disabled ? "You are muted" : "Enter a message..."}
		/>
	</div>
	<img
		class="item"
		src={send_icon}
		alt="send"
		on:click={sendMessage}
		on:keypress={sendMessage}/>
</div>

<style>
	.suggestion-container {
		display: flex;
		justify-content: flex-start;
		background-color: var(--box-color);
		border-radius: 1rem;
		margin: 0.5rem;
		width: 90vw;
		overflow-x: auto;
		overflow-y: hidden;
		/*padding: 0.2em;*/
	}

	.suggestion {
		max-height: 10em;
		margin: 0.5em;
		border-radius: 1em;
	}

	.suggestion:hover {
		filter: brightness(50%);
	}

	.suggestion:active {
		filter: brightness(40%);
	}

	.input-container {
		position: relative;
		flex-grow: 1;
		width: 90%;
		max-height: 100%;
		display: flex;
		align-self: center;
	}

	pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		max-height: 100%;
	}

	pre,
	textarea {
		font-family: inherit;
		padding: 0.5em;
		box-sizing: border-box;
		line-height: 1.2;
		overflow-y: auto;
		overflow-x: hidden;
		background-color: var(--box-color) !important;
		margin-left: 1em;
		min-width: 20vw;
		scrollbar-color: var(--scrollbar-thumb) transparent;
		border: none;
		padding: 1.5em;
		display: flex;
		max-height: 100%;
	}

	*:focus {
		outline: none !important;
		box-shadow: none;
	}

	textarea {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		resize: none;
	}

	.item {
		width: 3em;
		height: 3em;
		margin: 0.5em;
		-webkit-filter: var(--invert);
		filter: var(--invert);
	}

	.item:hover {
		-webkit-filter: var(--invert) opacity(50%);
		filter: var(--invert) opacity(50%);
	}

	.text-container {
		display: flex;
		background-color: var(--box-color);
		border-radius: 1em;
		max-height: 50%;
	}
</style>
