<script src="sweetalert2.min.js">
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
			window.location.href = 'http://localhost:5173/profile/' + username;
		} else {
			const info = await response.json();
			const Toast = Swal.mixin({
				toast: true,
				position: 'center',
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
</script>

<div class='block_container'>
	<div class="block_vert">
		<div class="block_hor">
		<h1>New User</h1>
	</div>
		<div class="block_hor">
			<input class='center' id='input' type='text' bind:value={username}
		   		placeholder='username' required minlength='1' maxlength='20'>
		</div>
		<div class="block_hor">
	<button class='center' id='setup' on:click={verify_code}>setup</button>
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

	.block_vert {
		flex-grow: 0.1;
		padding: 25px;
		align-items: center;
		justify-content: center;
		height: 225px;
	}
</style>
