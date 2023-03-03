<script lang="ts">
	import { icon_path } from "$lib/constants";

	//http://alistapart.com/article/expanding-text-areas-made-elegant/
	const send_icon = `${icon_path}/send.svg`;

	let content = "";
	let timer: NodeJS.Timeout;
	let suggestions = [];
	$: lines = (content.match(/\n/g)?.length + 1 || 1);

	function onInput(event) {
		clearTimeout(timer);
		suggestions = [];
		const matches = /^\/tenor (.*)/g.exec(content);
		if (matches && matches.length === 2) {
			console.log(matches[1]);
			timer = setTimeout(() => {
				suggestions = [
					{
						title: "",
						desc: "0001 GIF",
						url: "https://media.tenor.com/mhLPO2VldCkAAAAM/0001.gif",
						width: 220,
						height: 220,
					},
					{
						title: "",
						desc: "Kitty Cat GIF",
						url: "https://media.tenor.com/ObyK0WXilXUAAAAM/kitty-cat.gif",
						width: 220,
						height: 432,
					},
				];
				console.log("search");
			}, 1000);
		}
	}
</script>

<div class="text-container">
	<!--<textarea class="inline input" bind:value={content} style={`height: ${lines}em`}/>-->
	<div class="input-container">
		<pre aria-hidden="true">{content + '\n'}</pre>
		<textarea on:input={onInput} bind:value={content} placeholder="Enter a message"/>
	</div>
	<img class="item" src={send_icon} alt='send'/>
</div>

{#each suggestions as { url }}
<div class="suggestion-container">
	<img src={url}/>
</div>
{/each}

<style>

.input-container {
	position: relative;
}

pre {
	white-space: pre-wrap;
	word-wrap: break-word;
}

pre, textarea {
	font-family: inherit;
	padding: 0.5em;
	box-sizing: border-box;
	line-height: 1.2;
	overflow: hidden;
	background-color: rgb(46, 50, 62) !important;
	margin-left: 1em;
	min-width: 20em;
	max-width: 50em;
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

.input {
	/*border: none !important;
	outline: none;
	-moz-box-shadow: none;
	box-shadow: none;
	*/
	overflow: hidden;
	resize: none;
	background-color: rgb(46, 50, 62) !important;
	width: 50em;
}

.inline {
	/*border: none;*/
	background-color: rgb(46, 50, 62);
	margin: 1em !important;
}

.text-container {
	display: flex;
	background-color: rgb(46, 50, 62);
	border-radius: 1em;
}

.suggestion-container {
	display: flex;
}

</style>
