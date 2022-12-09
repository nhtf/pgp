<script lang="ts">
    import { onMount } from "svelte";
	import {type user, getOnlineUsers, invitePlayer, getFriends} from './getUsers';
	import {default_profile_image as profile_image} from '../../+layout'

	/** @type {import('./$types').PageData} */
	export let data: any;

	let done = false;
	let onlineUsers: user[];
	let friends: user[];
	
	
	onMount(async () => {
		onlineUsers = await getOnlineUsers();
		friends = await getFriends();
		done = true;
		
	});
</script>

<!-- info block -->
<div class="info">
	<div class="block vertical-block">
		<img id="avatar" src={profile_image} alt="avatar" />
		<div class="block vertical-block item" id="details">
			<div class="avatar-spacing" />
			<h1 id='username'>{data.username}#{data.user_id}</h1>
		</div>
	</div>
</div>

<!-- friend block -->
<div class="block vertical-block item" id="friends">
	<h1 class="fill">Friends</h1>
	{#if done}
		<div class="scrollable">
			<table id="myTable">
				{#each friends as {username, avatar}}
					<tr id='test'>
						<td><a href='/profile/{username}'>{username}</a></td>
						<td><img id="small-avatar" src={avatar} alt="avatar" /></td>
						<td><button on:click={() => invitePlayer(username)}>invite</button></td>
					</tr>
				{/each}
			</table>
		</div>
	{/if}
</div>

<!-- online user block -->
<div class="block vertical-block item" id="online">
	<h1 class="fill">Online Users</h1>
	{#if done}
		<div class="scrollable">
			<table id="myTable">
				{#each onlineUsers as {username, avatar}}
					<tr id='test'>
						<td><a href='/profile/{username}'>{username}</a></td>
						<td><img id="small-avatar" src={avatar} alt="avatar" /></td>
						<td><button on:click={() => invitePlayer(username)}>invite</button></td>
					</tr>
				{/each}
			</table>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI",
			Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica,
			Arial, sans-serif;
	}

	tbody {
		width: 200px;
		height: 400px;
		overflow: auto;
	}

	#myTable {
		position: relative;
		width: 80%;
		height: 90%;
		overflow: auto;
		margin: auto;
		border: #35cc88;
		outline: #35cc88;
	}

	.scrollable {
		width: 400px;
		height: 500px;
		overflow: auto;
		position: relative;
		margin: auto;
	}

	.vertical-block {
		width: 25%;
	}

	.item {
		border-radius: 5%;
		margin: 1em;
		background-color: white;
	}

	.avatar-spacing {
		display: block;
		float: left;
		min-width: 0px;
		width: 60%;
		height: 100px;
	}

	.fill {
		width: 100%;
	}

	#small-avatar {
		display: block;
		max-width: 35px;
		max-height: 35px;
		border-radius: 50%;
		margin: 5px;
		top: auto;
	}

	#avatar {
		position: relative;
		width: 30%;
		/* height: 30%; */
		border-radius: 50%;
		margin-left: 10%;
		margin-top: 10%;
		z-index: 1;
	}

	#username {
		position: relative;
		text-align: right;
		top: -10%;
		right: 10%;
	}

	#details {
		display: block;
		position: absolute;
		top: 15%;
		z-index: 0;
		height: 70%;
		border-radius: 5%;
	}

	#friends {
		display: block;
		position: absolute;
		top: 15%;
		height: 70%;
		border-radius: 5%;
		left: 33%;
		text-align: center;
	}

	#online {
		display: block;
		position: absolute;
		top: 15%;
		height: 70%;
		border-radius: 5%;
		left: 66%;
		text-align: center;
	}

	.info {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: stretch;
		padding: 0px;
	}
</style>
