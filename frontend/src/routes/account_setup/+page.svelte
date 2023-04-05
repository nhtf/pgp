<script lang="ts">
	import { put } from "$lib/Web";
    import { goto, invalidate } from '$app/navigation';
    import { unwrap } from "$lib/Alert";
    import { BACKEND } from "$lib/constants";

	let username = "";

	async function set_username() {
		await unwrap(put('/user/me/username', { username }));
		await invalidate(`${BACKEND}/user/me`);
		await goto(`/profile/${encodeURIComponent(username)}`);
	}

	async function key_event(event: KeyboardEvent) {
		if (event.key == "Enter") {
			set_username();
		}
	}
</script>

<div class='block-container'>
	<div class="block-vert">
		<div class="block-hor">
		<h1>New User</h1>
	</div>
		<div class="block-hor">
			<input class='center' id='input' type='text' bind:value={username}
				   placeholder='username' required minlength='3' maxlength='20' on:keypress={key_event}>
		</div>
		<div class="block-hor">
	<button class='center' id='setup' on:click={set_username}>setup</button>
</div>
</div>
</div>

<style>
	:global(body) {
		font-family: "Open Sans", -apple-system, BlinkMacSystemFont, 
		"Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, 
		"Helvetica Neue", Helvetica, Arial, sans-serif;
	}

	#input {
		border-radius: 6px;
		width: 300px;
		font-size: 35px;
		background: var(--bkg-color);
		color: var(--text-color);
		border-color: var(--border-color);
	}

	#setup {
		color: var(--text-color);
		font-size: large;
		width: 150px;
		margin-top: 20px;
		border-radius: 6px;
		border: 2px solid var(--scrollbar-thumb);
		background-color: var(--box-color);
		padding-top: 5px;
		padding-bottom: 5px;
		cursor: pointer;
	}

	.block-vert {
		flex-grow: 0.1;
		padding: 25px;
		align-items: center;
		justify-content: center;
		height: 225px;
	}
</style>
