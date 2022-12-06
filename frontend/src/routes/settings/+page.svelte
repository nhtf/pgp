<script>
	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	export let data;

	let show = false;

	let profile_image = 'https://www.w3schools.com/howto/img_avatar.png';

	function toggle_dropdown() {
		show = !show;
	}
</script>

<header>
	<div class='navbar'>
		<a href='/' >Home</a>
		<a href='/leaderboard'>Leaderboard</a>
		<a href='/chat'>Chat</a>

		<div class='corner'>
			<a id='user' href='' on:click='{toggle_dropdown}'>
				<span>{data.username}</span>
				<img id='small-avatar' src={profile_image} alt='small-avatar'/>
			</a>
			{#if show}
				<div class='dropdown'>
					<a class='dropdown-item' href=''>settings</a>
					<a class='dropdown-item' href=''>logout</a>
				</div>
			{/if}
		</div>
	</div>

</header>

<div class='item' id='settings'>
	<h1>Settings</h1>
</div>

<style>
:global(body) {
  font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica, Arial, sans-serif;
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

#small-avatar {
	display: block;
	max-width: 35px;
	max-height: 35px;
	border-radius: 50%;
	margin: 5px;
}

.item {
	margin: 1em;
	background-color: white;
}

#settings {
	min-width: 30em;
	max-width: 100%;
	min-height: 50em;
	max-height: 100%;
	margin: 1em;
}
</style>
