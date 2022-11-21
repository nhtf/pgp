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
		console.log(response);
	}
</script>

<div class='flex-container'>
	<input class='center' id='input' type='text' bind:value={code} inputmode='numeric' pattern='\d{6}'
		   placeholder='totp code' required minlength='6' maxlength='6'>
	<button class='center' id='verify' on:click={verify_code}>verify</button>
</div>

<style>
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
