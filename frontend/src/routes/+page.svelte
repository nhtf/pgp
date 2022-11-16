<script>
	import { onMount } from 'svelte';
	import * as qrcode from 'qrcode';
	import { authenticator } from 'otplib';

	let image;
	let code;

	onMount(async () => {
		let secret;
		await fetch('http://localhost:3000/otp/setup',
				{ method: 'POST', credentials: 'include', mode: 'cors' }).then(r => r.json()).then(data => {
			secret = data;
		});

		const otpauth = authenticator.keyuri('yes', 'pgp', secret);
		const promise = new Promise((resolve, reject) => {
			qrcode.toDataURL(otpauth, (error, image_url) => {
				if (error) {
					reject(error);
				} else {
					resolve(image_url);
				}
			});
		});

		try {
			image = await promise;
			console.log(image);
		} catch (error) {
			console.error(error);
		}

	});

	async function verify_code() {
		const response = await fetch('http://localhost:3000/otp/setup_verify', {
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: `otp=${code}`
			}).then((data) => {
				console.log(data.json());
			});
	}

</script>

{#key image}
<img src={image}>
{/key}
<input type='text' bind:value={code} inputmode='numeric' pattern='\d*' required minlength='6' maxlength='6'>
<button on:click={verify_code}>verify</button>
