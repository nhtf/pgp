<script>
	import { onMount } from 'svelte';
	import { redirect } from '@sveltejs/kit'
	let login = 'anomynous';
	let image = 'https://www.w3schools.com/howto/img_avatar.png';

	async function request(path, method) {
		return await fetch(`http://localhost:3000/${path}`,
				{
					method: method,
					credentials: 'include',
					mode: 'cors'
				});
	}

	export async function load({ locals }) {
		console.log('hi');
	}

	onMount(async () => {
		const result = await request('whoami', 'GET');
		if (result.ok) {
			const data = await result.json();
			image = data.image;
			login = data.id;
		} else {
			console.log(result);
			window.location = 'http://localhost:3000/oauth/login';
		}
	});
</script>

<div id='spacing'>
	<img id='avatar' src={image} alt='avatar'>
</div>

<div id='profile'>
</div>

<style>
:global(body) {
	background-color: lightseagreen;
}

#avatar {
	border-radius: 50%;
	max-width: 12%;
	height: auto;
	align-self: flex-end;
}

#spacing {
	width: 100%;
	height: 300px;
	justify-content: center;
	display: flex;
}

#profile {
	width: 800px;
	height: 1000px;
	background: white;
	border-radius: 25px;
	margin-left: auto;
	margin-right: auto;
}
</style>
