<script>
	import { page } from '$app/stores';
	import Swal from 'sweetalert2';

	/** @type {import('./$types').PageData} */
	export let data;

	$: enabled_2fa = (data.auth_req === 1);

	async function enable_2fa() {
		const response = await fetch('http://localhost:3000/otp/setup', {
			method: 'POST',
			credentials: 'include'
		});

		if (!response.ok) {
			console.error(response.message);
		} else {
			const data = await response.json();

			console.log(data.secret);
			Swal.fire({
				title: 'Setup 2FA',
				input: 'text',
				imageUrl: `${data.qr}`,
				imageWidth: 400,
				imageHeight: 400,
				imageAlt: '2FA qr code',
				showCancelButton: true,
				confirmButtonText: 'Setup',
				showLoaderOnConfirm: true,
				preConfirm: (code) => {
					return fetch('http://localhost:3000/otp/setup_verify', {
						method: 'POST',
						credentials: 'include',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded'
						},
						body: `otp=${code}`
					}).then(response => {
						console.log(response);
						if (!response.ok) {
							throw new Error('not ok');
						}
						return "done";
					}).catch(error => {
						Swal.showValidationMessage(`Could not setup 2FA: ${error}`);
					});
				},
				allowOutsideClick: ()  => !Swal.isLoading()
			}).then((result) => {
				if (result.isConfirmed) {
					Swal.fire({
						position: 'top-end',
						icon: 'success',
						title: 'Successfully setup 2FA',
						showConfirmButton: false,
						timer: 1300
					});
					data.auth_req = 2;
				}
			});
		}
		data = data;

		enabled_2fa = true;
	}

	async function disable_2fa() {
		Swal.fire({
			title: 'Are you sure?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, disable 2FA',
			cancelButtonColor: '#d33',
			confirmButtonColor: '#198754',
			allowOutsideClick: () => !Swal.isLoading(),
			preConfirm: () => {
				return fetch('http://localhost:3000/otp/disable', {
					method: 'POST',
					credentials: 'include'
				}).then(response => {
					if (!response.ok)
						throw new Error(response.statusText);
					return response.json();
				}).catch(error => {
					console.log('welp');
				});
			}
		}).then((result) => {
			if (result.isConfirmed) {
					Swal.fire({
						position: 'top-end',
						icon: 'success',
						title: 'Successfully disabled 2FA',
						showConfirmButton: false,
						timer: 1300
					});
					data.auth_req = 1;
			}
		});
		data = data;
		enabled_2fa = false;
	}
</script>

<header>
</header>

<div class="block_container">
	<div class="block_vert" id="info">
		<div class="block_hor">
			<div class="block_cell">
				<h1>2FA</h1>
			</div>
			{#if enabled_2fa}
			<button on:click={enable_2fa}>enable 2fa</button>
			{:else}
			<button on:click={disable_2fa}>disable 2fa</button>
			{/if}
			<div class="block_cell">
				<h2>Some text</h2>
			</div>
		</div>
	</div>
</div>

<style>
:global(body) {
	font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI",
		Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica,
		Arial, sans-serif;
}

.block_container {
	display: flex;
	gap: 10px;
	padding: 25px;
	flex-wrap: wrap;
	color: var(--text-color);
	text-decoration: none;
}

.block_vert {
	height: calc(90vh - 10em);
	flex-grow: 0.1;
	display: flex;
	margin: 25px;
	background: var(--box-color);
	border-radius: 6px;
	flex-direction: column;
	justify-content: flex-start;
	align-items: center;
	overflow-y: auto;
	border-width: 2px;
	border-color: var(--border-color);
	border-style: solid;
	scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-bkg);
	scrollbar-width: thin;
}

.block_hor {
	display: flex;
	flex-direction: row;
	padding: 3px;
	justify-content: space-evenly;
	align-items: center;
	/* align-self: stretch; */
}

#settings {
	flex-grow: 3;
}
</style>
