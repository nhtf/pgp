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
		<a href='/home' >Home</a>
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

<div class='info'>

	<!--
	<img id='avatar' src={profile_image} alt='avatar'>
	<div class='item detail'>
		<div class='spacing'/>
		<h1>{name}</h1>

	</div>
	<div class='item history'>

	</div>
	-->
	<div class='block vertical-block'>
		<img id='avatar' src={profile_image} alt='avatar'/>
		<div class='block vertical-block item' id='details'>
			<div class='avatar-spacing'/>
				<h1 class='fill'>#1</h1>
				<h1 class='fill shift-right'>{data.username}#{data.user_id}</h1>
		</div>
	</div>
	<div class='spacing'/>
	<div class='block vertical-block horizontal-block item'/>
	<div class='block vertical-block horizontal-block item'/>
	<div class='block vertical-block horizontal-block item'/>
	<div class='block vertical-block horizontal-block item'/>
	<div class='block vertical-block horizontal-block item'/>
	<div class='block vertical-block horizontal-block item'/>
	<div class='block vertical-block horizontal-block item'/>
	<div class='block vertical-block horizontal-block item'/>
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

.block {
	float: left;
}

.vertical-block {
	min-width: 400px;
	max-width: 500px;
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
}

#avatar {
	position: relative;
	max-width: 200px;
	max-height: 200px;
	border-radius: 50%;
	margin-left: 50px;
	z-index: 1;
}

#details {
	display: block;
	position: relative;
	top: -100px;
	z-index: 0;
	height: 600px;
	border-radius: 7%;
}
</style>
