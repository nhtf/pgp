<script lang="ts">
	import { _default_profile_image as profile_image } from "../../+layout";
	import { page } from "$app/stores";
	/** @type {import('./$types').PageData} */
	export let data: { user: any; online_users: user[]; friends: user[] };

	import { invitePlayer, type user } from "./getUsers";

	const add_friend = "/add-friend.png";
	const remove_friend = "/remove-friend.png";
	const pong_icon = "/pong-icon.png";

	function toggleDropOut(username: string) {
		if (document.getElementById(username)) {
			const elem = document.getElementById(username);
			if (elem) {
				const temp = elem.style.display;
				resetToggles();
				if (temp === "none" || temp === "") {
					elem.style.display = "flex";
				} else {
					elem.style.display = "none";
				}
			}
		}
	}

	function resetToggles() {
		var dropdowns = document.getElementsByClassName("dropdown-content");
		for (let i = 0; i < dropdowns.length; i++) {
			const dropDown = dropdowns[i] as HTMLElement;
			dropDown.style.display = "none";
		}
	}

	function clickfunction(event: MouseEvent) {
		if (!event || !event.target) {
			return;
		}
		console.log(event.target);
		const element = event.target as Element;
		if (!element.matches("#dropbtn")) {
			resetToggles();
		}
	}
</script>

<svelte:window on:click={clickfunction}/>

<div class="block_container">
	<div class="block_vert" id="info">
		<div class="block_hor">
			<div class="block_cell">
				<h1>{$page.params.username}</h1>
			</div>
			<div class="block_cell">
				{#if data.user.avatar}
					<img id="avatar" src={data.user.avatar} alt="avatar" />
				{:else}
					<img id="avatar" src={profile_image} alt="avatar" />
				{/if}
			</div>
		</div>
	</div>
	<div class="block_vert">
		<h1>Friends</h1>
		{#if data.friends}
			{#each data.friends as { username, avatar, online, in_game }}
				<div class="block_hor">
					<div class="block_cell"
						on:click={() => toggleDropOut(username)}
						on:keypress={() => toggleDropOut(username)}
					>
						<div class="block_hor" id="dropbtn">{username}</div>
						{#if online && !in_game}
							<div class="block_hor" id="online">online</div>
						{:else if !in_game}
							<div class="block_hor" id="offline">offline</div>
						{:else}
							<div class="block_hor" id="in_game">playing</div>
						{/if}
						<div id={username} class="dropdown-content">
							<div class="block_hor" id="drop-cell">view profile</div>
							{#if in_game}
								<div class="block_hor" id="drop-cell">spectate</div>
							{/if}
							{#if online}
								<div class="block_hor" id="drop-cell">invite game</div>
							{/if}
							<div class="block_hor" id="drop-cell">other link</div>
						</div>
					</div>
					<a href="/profile/{username}">
						<div class="block_cell">
							<img id="small-avatars" src={avatar} alt="avatar" />
						</div>
					</a>
					<!-- <div class="block_cell">
						<img id="invite" on:click={() => invitePlayer(username)} src={pong_icon} alt="invite player"/>
					</div> -->
				</div>
			{/each}
		{/if}
	</div>
	<!-- <div class="block_vert">
		<h1>Online (temp)</h1>
		{#if data.online_users}
			{#each data.online_users as { username, avatar, friend }}
				<div class="block_hor">
					<a id="profile_link"href="/profile/{username}">
						<div class="block_cell">{username}</div>
					</a>
					<a href="/profile/{username}">
						<div class="block_cell">
							<img id="small-avatars" src={avatar} alt="avatar" />
						</div>
					</a>
					<div class="block_cell">
						<img id="invite" on:click={() => invitePlayer(username)} src={pong_icon} alt="invite player"/>
					</div>
					<div class="block_cell">
						{#if !friend}
						<img id="invite" on:click={() => invitePlayer(username)} src={add_friend} alt="add friend"/>
						{:else}
						<img id="invite" on:click={() => invitePlayer(username)} src={remove_friend} alt="remove friend"/>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div> -->
</div>

<style>
	:global(body) {
		font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI",
			Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica,
			Arial, sans-serif;
	}

	.block_container {
		display: flex;
		gap: 10px;
		padding: 25px;
		flex-wrap: wrap;
		color: var(--text-color);
		text-decoration: none;
	}

	/* vertical blocks */
	.block_vert {
		height: calc(90vh - 10em);
		flex-grow: 0.1;
		display: flex;
		margin: 25px;
		background: var(--box-color);
		border-radius: 6px;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		overflow-y: auto;
		border-width: 2px;
		border-color: var(--border-color);
		border-style: solid;
		scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-bkg);
		scrollbar-width: thin;
	}

	#info {
		flex-grow: 3;
	}

	a {
		text-decoration: none;
	}

	/* horizontal blocks */
	.block_hor {
		display: flex;
		flex-direction: row;
		padding: 3px;
		justify-content: space-evenly;
		align-items: center;
		/* align-self: stretch; */
	}

	#profile_link:hover {
		box-shadow: 0 0 3px 2px rgba(var(--shadow-color));
		border-radius: 6px;
	}

	.block_cell {
		padding: 5px;
		justify-content: space-evenly;
		flex-grow: 0;
		width: 80px;
		max-height: 40px;
		align-items: center;
		color: var(--text-color);
		text-decoration: none;
		text-align: center;
	}

	.block_cell:first-child {
		flex-grow: 1;
		text-align: center;
	}

	#small-avatars {
		max-width: 35px;
		max-height: 35px;
		border-radius: 50%;
		margin-right: 2em;
	}

	#invite {
		max-width: 35px;
		max-height: 35px;
		border-radius: 50%;
		margin-right: 2em;
		-webkit-filter: var(--invert);
		filter: var(--invert);
	}

	#small-avatars:hover {
		box-shadow: 2px 2px 5px 5px rgba(var(--shadow-color));
	}

	#invite:hover {
		box-shadow: 2px 2px 5px 5px rgba(var(--shadow-color));
	}

	#avatar {
		width: 100px;
		border-radius: 50%;
		z-index: 1;
	}

	#online,
	#offline,
	#in_game {
		position: relative;
		font-size: small;
		top: -5px;
		cursor:default;
	}

	#online {
		color: #5193af;
	}

	#offline {
		color: rgb(250, 93, 93);
	}

	#in_game {
		color: #88c5a4;
	}

	.dropdown-content {
		display: none;
		flex-direction: column;
		position: relative;
		width: 120px;
		background-color: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		box-shadow: 1px 8px 16px 1px rgba(0, 0, 0, 0.4);
		z-index: 20;
		/* align-items:stretch; */
	}

	#drop-cell {
		color: var(--text-color);
		padding: 8px 10px;
		border-radius: 6px;
	}

	#drop-cell:hover {
		box-shadow: 1px 1px 2px 2px rgba(var(--shadow-color));
		cursor: pointer;
	}

	#dropbtn {
		cursor: pointer;
		align-self: center;
	}

	#dropbtn:hover {
		text-decoration: underline;
	}

	::-webkit-scrollbar {
		background: var(--box-color);
		width: 11px;
		box-shadow: inset 0 0 10px 10px var(--scrollbar-bkg);
		border-top: solid 1px transparent;
		border-bottom: solid 1px transparent;
	}

	::-webkit-scrollbar-thumb {
		border-top: 3px solid transparent;
		border-left: 3px solid transparent;
		border-right: 2px solid transparent;
		border-bottom: 3px solid transparent;
		border-radius: 8px 8px 8px 8px;
		box-shadow: inset 12px 12px 12px 12px var(--scrollbar-thumb);
		margin: 0px auto;
	}
</style>
