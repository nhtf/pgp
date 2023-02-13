<script lang="ts">
	import { page } from "$app/stores";
	import Avatar from "./avatar.svelte";
	import Achievements from "./achievements.svelte";
	import { unwrap } from "$lib/Alert";
	import { put } from "$lib/Web";
	import { goto,  } from "$app/navigation";
	import { CloseButton } from "flowbite-svelte";

	function clickfunction(event: MouseEvent) {
		if (!event || !event.target)
			return;
		const element = event.target as Element;
		if (!element.matches(".icon") && !element.matches(".achievement_cell") && !element.matches(".icon-block")) {
			const achievements = document.getElementsByClassName("achievement-display");
			for (let i = 0; i < achievements.length; i += 1) {
				const ach = achievements[i] as HTMLElement;
				ach.style.display = "none";
			}
		}
	}

	$: username = $page.data.user.username;
	let editUsername: string;

	async function changeUserName() {
		const body = {
			username: editUsername
		};
		let res = await unwrap(put("/user/me/username", body, true));
		//TODO check if this succeeds etc/
		goto(`/profile/${encodeURIComponent(editUsername)}`)
		show_edit = false;
	}

	const edit_icon = "/Assets/icons/pen.png";
	let show_edit = false;

	function toggleEdit() {
		show_edit = !show_edit;
		// src = null;
	}
</script>

<svelte:window on:click={clickfunction}/>

<div class="block-vert" id="info">
	<div class="block-hor" id="user-block">
		<div class="block-cell" id="user-name-block">
			<div class="block-hor">
				<h1>{$page.params.username}</h1>
				{#if $page.data.user?.username === $page.data.profile?.username}
        <img src={edit_icon} alt="edit icon" id="edit-icon"
            on:click={toggleEdit}
            on:keypress={toggleEdit}
        />
		{#if show_edit}
			<div class="edit-username-window">
				<div class="close">
					<CloseButton on:click={toggleEdit}/>
				</div>
				Change Username
				<div class="username-input">
					<input name="username" class="input"  id="edit-username"
                        type="text" bind:value={editUsername} placeholder="username"
                    />
					<div class="send-button"
						on:click|preventDefault={changeUserName}
						on:keypress|preventDefault={changeUserName}
						>
						<img src="/Assets/icons/send.svg" alt="send" class="icon">
					</div>
					
				</div>
			</div>
		{/if}

		{/if}
			</div>
			<div class="block-hor" id="level-hor">
				<div class="block-cell" id="level-block">
					<div class="block-hor" id="level-text">33</div>
					<div class="block-hor" id="level-text">Level</div>
				</div>
				<div class="block-cell" id="level-block-bar">
					<div class="block-hor" id="level-bar">
						<div class="border">
							<div class="bar" style="height:18px;width:20%" />
						</div>
					</div>
					<div class="block-hor" id="level-exp">123/12345 exp</div>
				</div>
			</div>
		</div>
		<Avatar/>
	</div>
	<div class="block-hor">
		<div class="block-cell">
			<Achievements/>
		</div>
	</div>
	<div class="block-hor">
		<div class="block-cell">
			<h3>Last game played</h3>
			<div class="block-hor" id="legend">
				<div class="block-cell table-cell" id="no-grow">opponent</div>
				<div class="block-cell table-cell">me</div>
				<!-- <div class="block-cell">other stats</div> -->
			</div>
			<div class="block-hor" id="content">
				<div class="block-cell table-cell" id="no-grow">5</div>
				<div class="block-cell table-cell">3</div>
				<!-- <div class="block-cell table-cell">nope</div> -->
			</div>
		</div>
	</div>
	{#if !$page.data.user?.in_game}
	<div class="block-hor">
		<div class="block-cell">
			<p>Current game stats</p>
		</div>
	</div>
	{/if}
</div>

<style>

	.close {
		align-self: end;
		position: relative;
		bottom: 0.5rem;
	}

	.username-input {
		display: flex;
	}

.icon {
        width: 30px;
        height: 30px;
        -webkit-filter: var(--invert);
		filter: var(--invert);
    }

	.send-button {
		display: flex;
		background-color: var(--box-color);
		height: 100%;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		width: 50px;
		cursor: pointer;
		margin-left: 0.375rem;
		margin-right: 0.375rem;
	}

	.send-button:hover {
		background-color: var(--box-hover-color);
	}

.input {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
		margin: 0 auto;
	}

.edit-username-window {
		display: flex;
		position: fixed;
		flex-direction: column;
		z-index: 25;
		top: calc(50% - 40px);
		left: calc(50% - 176px);
		background: var(--box-color);
		border-radius: 6px;
		border-width: 1px;
		border-color: var(--border-color);
		border-style: solid;
		box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
		width: 400px;
		height: 120px;
		justify-content: space-evenly;
		align-items: center;
		text-align: center;
		align-self: flex-end;
	}

#edit-icon {
		max-width: 15px;
		max-height: 15px;
		position: relative;
		top: 10px;
		/* right: -35px; */
		cursor: pointer;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		border-radius: 6px;
	}

	#edit-icon:hover {
		box-shadow: 1px 1px 1px 1px var(--shadow-color);
	}

	#user-name-block {
		padding: 0;
		padding-right: 3px;
	}

	.table-cell {
		/* border: 1px solid var(--border-color);
		border-radius: 6px; */
		/* box-shadow: 1px 1px 1px 1px var(--hover-color); */
		min-height: 25px;
	}

	#content {
		border-radius: 6px;
		height: 30px;
		max-width: 250px;
	}

	#legend {
        background: var(--box-color);
		border-radius: 6px;
		height: 30px;
        /* box-shadow: 0 0 0 var(--box-color); */
		box-shadow: 2px 3px 5px 2px rgba(0, 0, 0, 0.4);
		margin-bottom: 5px;
		max-width: 250px;
    }

	#no-grow {
		flex-grow: 0;
	}

	#user-block {
		width: -moz-available;
		width: -webkit-fill-available;
		padding-left: 0;
		padding-right: 0;
		padding-top: 15px;
	}

	#level-block {
		max-width: 40px;
		min-width: 20px;
		height: 60px;
	}

	#level-bar {
		flex-grow: 1;
		padding-top: 0;
		padding-bottom: 0;
	}

	#level-block-bar {
		flex-grow: 1;
		height: 60px;
	}

	#level-exp {
		font-size: 12px;
		padding-top: 0;
		padding-bottom: 0;
		justify-content: flex-end;
	}

	#level-text {
		padding: 0;
	}

	.bar {
		background: var(--bar-prog-color);
		border-radius: 10px;
	}

	.border {
		background: var(--bar-bkg-color);
		border: 1px solid var(--hover-color);
		border-radius: 10px;
		width: 100%;
	}

	#info {
		flex-grow: 3;
		max-width: 600px;
		height: 100%;
		padding-left: 5px;
		padding-right: 5px;
	}

	.block-vert {
		flex-grow: 0.1;
	}

	.block-hor {
		width: -moz-available;
		width: -webkit-fill-available;
	}

	.block-cell {
		flex-direction: column;
		min-width: 100px;
		min-height: 40px;
		padding: 5px;
	}

	.block-cell:first-child {
		flex-grow: 1;
		text-align: center;
	}

</style>
