<script lang="ts">
	import type { Suggestion } from "$lib/types";
	import { icon_path } from "$lib/constants";
	import { unwrap } from "$lib/Alert";
	import { get } from "$lib/Web";

	export let callback: (content: string) => boolean;
	export let disabled: boolean;

	//http://alistapart.com/article/expanding-text-areas-made-elegant/
	const send_icon = `${icon_path}/send.svg`;

	let content = "";
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

	//$: rows = (content.match(/\n/g)?.length! + 1 || 1);

	async function getSuggestions(which: "tenor" | "giphy", query: string) {
		return unwrap(get(`/media/${which}`, { query }));
	}

	function getTenorQuery(txt: string) {
		const matches = /^\/tenor (.*)/g.exec(txt);
		if (matches && matches.length === 2) return matches[1];
		return undefined;
	}
	/*

	async function onKeyPress(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			clearTimeout(timer);
			const query = getTenorQuery(content);
			if (query && running) {
				const tmp = await getSuggestions(query);
				apply(tmp[0].url);
			} else if (suggestions.length !== 0) {
				apply(suggestions[0].url);
			} else {
				sendMessage();
			}
			running = false;
		}
	}
	//TODO also hanlde onInput so that Ctrl-A Del/backspace works
	async function onInput(event: Event) {
		clearTimeout(timer);
		if (!getTenorQuery(content)) {
			suggestions = [];
		}
		running = true;
		timer = setTimeout(async () => {
			running = false;
			const query = getTenorQuery(content);
			if (query) {
				suggestions = await getSuggestions(query);
			}
		}, 1000);
	}*/

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

	function sendMessage() {
		if (content.length) {
			if (callback(content)) {
				content = "";
			} 
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
				src={src}
				alt={desc}
			/>
		{/each}
	</div>
{/if}

<div class="text-container">
	<!--<textarea class="inline input" bind:value={content} style={`height: ${lines}em`}/>-->
	<div class="input-container">
		<pre aria-hidden="true">{`${content}\n`}</pre>
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
		border-radius: 1em;
		margin: 0.5em;
		width: 90vw;
		overflow-x: auto;
		overflow-y: hidden;
		/*scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-bkg);
	scrollbar-width: thin;*/
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
	}

	pre {
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	pre,
	textarea {
		font-family: inherit;
		padding: 0.5em;
		box-sizing: border-box;
		line-height: 1.2;
		overflow: hidden;
		background-color: var(--box-color) !important;
		margin-left: 1em;
		min-width: 20vw;
		/* max-width: 60vw; */
		max-height: 50em;
		border: none;
		padding: 1.5em;
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
	}

	.item:hover {
		filter: brightness(50%);
	}

	.text-container {
		display: flex;
		background-color: var(--box-color);
		border-radius: 1em;
		margin: 0.2em;
	}
</style>
