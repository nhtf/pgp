<script lang="ts" src="sweetalert2.min.js">
    import { goto, invalidate } from '$app/navigation';
    import { BACKEND } from '$lib/constants';
	import { post } from "$lib/Web";
	import Swal from 'sweetalert2';

	let code: string = "";

	async function verify_code() {
		try {
			await post(`/otp/verify`, { otp: code });
			await invalidate(`${BACKEND}/user/me`);
			await goto(`/profile`);
		} catch (error) {
			const Toast = Swal.mixin({
				toast: true,
				position: 'top-end',
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: true,
			});

			Toast.fire({
				icon: 'error',
				title: 'Invalid totp'
			});

		}
	}
</script>

<div class='flex-container'>
	<input class='center' id='input' type='text' bind:value={code} inputmode='numeric' pattern='\d{6}'
		   placeholder='totp code' required minlength='6' maxlength='6'>
	<button class='center' id='verify' on:click={verify_code}>verify</button>
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

#verify {
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
