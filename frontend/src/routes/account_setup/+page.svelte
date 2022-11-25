<script src="sweetalert2.min.js">
	import { onMount } from 'svelte';
	import Swal from 'sweetalert2';
	let username = '';

	async function verify_code() {
		const response = await fetch('http://localhost:3000/account/setup',
			{
				method: 'POST',
				credentials: 'include',
				mode: 'cors',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: `username=${username}`
			});
		if (response.ok) {
			window.location = 'http://localhost:5173/profile';
		} else {
			const info = await response.json();
			const Toast = Swal.mixin({
				toast: true,
				position: 'top-end',
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: true,
			});

			Toast.fire({
				icon: 'error',
				title: info.message
			});
		}
	}

	onMount(async() => {
		const response = await fetch('http://localhost:3000/account/whoami',
			{
				method: 'GET',
				credentials: 'include',
				mode: 'cors',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
			});
		if (response.ok) {
			window.location = 'http://localhost:5173/profile';
		} else if (response.status === 401) {
			window.location = 'http://localhost:3000/login';
		}
	});
</script>

<div class='flex-container'>
	<input class='center' id='input' type='text' bind:value={username}
		   placeholder='username' required minlength='1' maxlength='20'>
	<button class='center' id='setup' on:click={verify_code}>setup</button>
</div>

<style>
:global(body) {
  font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.flex-container {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vw;
	flex-direction: column;
}

#input {
	width: 300px;
	font-size: 35px;
}

#setup {
	width: 300px;
	margin-top: 20px;
	border-radius: 0%;
	background-color: #38d890;
	border-color: #38d890;
	padding-top: 5px;
	padding-bottom: 5px;
	border-style: solid;
}

#verify:hover {
	background-color: #35cc88;
}
</style>
