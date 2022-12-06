<script lang="ts">
	import { onMount } from "svelte";

	/** @type {import('./$types').PageData} */
	export let data: any;

	let show = false;
	let done = false;
	let userlog: string;

	let profile_image = "https://www.w3schools.com/howto/img_avatar.png";

	function toggle_dropdown() {
		show = !show;
	}

	type user = {username: string; friend: boolean; avatar: string};
	let users: user[] = [
		{username: "dummy1", friend: false,avatar: profile_image},
		{username: "dummy2", friend: false,avatar: profile_image},
		{username: "dummy3", friend: false,avatar: profile_image},
		{username: "dummy4", friend: false,avatar: profile_image},
		{username: "dummy5", friend: false,avatar: profile_image},
		{username: "dummy6", friend: false,avatar: profile_image},
		{username: "dummy7", friend: false,avatar: profile_image},
		{username: "dummy8", friend: false,avatar: profile_image},
		{username: "dummy9", friend: false,avatar: profile_image},
		{username: "dummy10", friend: false, avatar: profile_image},
		{username: "dummy11", friend: false, avatar: profile_image},
		{username: "dummy12", friend: false, avatar: profile_image}
	];
	onMount(async () => {
		const who = await fetch("http://localhost:3000/whoami", {
			method: "GET",
			credentials: "include",
			mode: "cors",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});
		const whoj = await who.json();
		userlog = whoj.username;
		const response = await fetch("http://localhost:3000/game/onlineUsers", {
			method: "GET",
			credentials: "include",
			mode: "cors",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});
		const json = await response.json();
		if (json !== undefined) {
			json.forEach((value: any) => {
				let newUser: user = {username: value.username, friend: value.friend, avatar: value.avatar};
				users.push(newUser);
			});
		}
		done = true;
		users.sort((a,b) => {
			return (a.friend === b.friend)? 0 : a? 1 : -1;
		});
	});
</script>

<header>
	<div class="navbar">
		<a href="/">Home</a>
		<a href="/leaderboard">Leaderboard</a>
		<a href="/chat">Chat</a>

		<div class="corner">
			<a id="user" href="" on:click={toggle_dropdown}>
				<span>{userlog}</span>
				<img id="small-avatar" src={profile_image} alt="small-avatar" />
			</a>
			{#if show}
				<div class="dropdown">
					<a class="dropdown-item" href="/settings">settings</a>
					<a class="dropdown-item" href="">logout</a>
				</div>
			{/if}
		</div>
	</div>
</header>

<div class="info">
	<!--
	<img id='avatar' src={profile_image} alt='avatar'>
	<div class='item detail'>
		<div class='spacing'/>
		<h1>{name}</h1>

	</div>
	<div class='item history'>

	</div>
	-->
	<div class="block vertical-block">
		<img id="avatar" src={profile_image} alt="avatar" />
		<div class="block vertical-block item" id="details">
			<div class="avatar-spacing" />
			<h1 id='username'>{data.username}#{data.user_id}</h1>
		</div>
	</div>
</div>

<div class="block vertical-block item" id="friends">
	<h1 class="fill">Friends</h1>
	<!-- <h1 class='fill shift-right'>{data.username}#{data.user_id}</h1> -->
</div>

<div class="block vertical-block item" id="online">
	<h1 class="fill">Online Users</h1>
	{#if done}
		<div class="scrollable">
			<table id="myTable">
				{#each users as {username, avatar}}
					<tr id='test'>
						<td><p>{username}</p></td>
						<td><img id="small-avatar" src={avatar} alt="avatar" /></td>
						<td><a href='/profile/{username}'>invite</a></td>
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

	.corner {
		margin: 10px;
		float: right;
	}

	#user {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: stretch;
		padding: 0px;
	}

	.dropdown {
		position: absolute;
		top: 50px;
		margin-right: 10px;
		width: 140px;
		background-color: white;
	}

	.dropdown a {
		color: black;
		margin: 10px;
	}

	.dropdown-item:hover {
		background-color: #35cc88;
	}

	/* .block {
		float: left;
	} */

	.vertical-block {
		width: 25%;
	}

	.horizontal-block {
		height: 400px;
	}

	.item {
		border-radius: 5%;
		margin: 1em;
		background-color: white;
	}

	.navbar {
		overflow: hidden;
		background-color: white;
		margin-bottom: 10px;
	}

	.navbar a {
		float: left;
		font-size: 30px;
		text-decoration: none;
		text-align: center;
		padding: 14px 16px;
	}

	.corner a {
		padding: 0px;
	}

	.corner p {
		display: block;
		margin: 0px;
	}

	.spacing {
		display: block;
		float: left;
		min-width: 0px;
		width: 50%;
		height: 100px;
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

	.shift-right {
		margin-left: 10px;
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

	#test {
		border: #35cc88;
		outline: #35cc88;
		outline-style: dashed;
	}

	.info {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: stretch;
		padding: 0px;
	}

	#history {
		min-width: 600px;
		max-width: 1200px;
		min-height: 600px;
		max-height: 600px;
	}
</style>
