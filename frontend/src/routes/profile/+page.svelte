<script>
	let name = 'nobody';
	let profile_image = 'https://www.w3schools.com/howto/img_avatar.png';
</script>

<header>
	<div class='navbar'>
		<a href='/home' >Home</a>
		<a href='/leaderboard'>Leaderboard</a>
		<a href='/chat'>Chat</a>
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
	<div class='item block-item'/>
	<div class='item block-item'/>
	<div class='item block-item'/>
	<div class='item block-item'/>
	<div class='item block-item'/>
	<div class='item block-item'/>
	<div class='item block-item'/>
	<div class='item block-item'/>
</div>


<style>
:global(body) {
  font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.item {
	border-radius: 5%;
	margin: 1em;
	background-color: white;
	min-width: 400px;
}

.block-item {
	float: left;
	max-width: 500px;
	height: 400px;
}

.history {
	display: block;
	min-width: 400px;
	max-width: 600px;
	height: 500px;
}

.spacing {
	display: block;
	height: 50px;
}

.detail {
	display: block;
	position: relative;
	top: -100px;
	z-index: 0;
	width: 400px;
	height: 500px;
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

#avatar {
	position: relative;
	max-width: 200px;
	max-height: 200px;
	border-radius: 50%;
	margin-left: 50px;
	z-index: 1;
}
</style>
