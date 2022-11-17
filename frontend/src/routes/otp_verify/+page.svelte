<script>
	let code;

	async function verify_code() {
		const response = await fetch('http://localhost:3000/otp/verify',
			{
				method: 'POST',
				credentials: 'include',
				mode: 'cors',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: `otp=${code}`
			});
	}
</script>


<input type='text' bind:value={code} inputmode='numeric' pattern='\d{6}'
	   required minlength='6' maxlength='6'>
<button on:click={verify_code}>verify</button>
