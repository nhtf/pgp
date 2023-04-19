<script lang="ts" src="sweetalert2.min.js">
	import { invalidate } from "$app/navigation";
	import { BACKEND } from "$lib/constants";
	import { post } from "$lib/Web";
	import { fly } from "svelte/transition";
	import Swal from "sweetalert2";

	let code: string = "";

	$: x = Math.random() * 100;
	$: y = Math.random() * 100;

	function move() {
		setTimeout(() => {
			x = Math.random() * 100;
			y = Math.random() * 100;
		}, 200);
	}

	async function verify_code() {
		try {
			await post(`/otp/verify`, { otp: code });
			await invalidate(`${BACKEND}/user/me`);
			window.location.assign(`/profile`);
		} catch (error) {
			const Toast = Swal.mixin({
				toast: true,
				position: "top-end",
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: true,
			});

			Toast.fire({
				icon: "error",
				title: "Invalid totp",
			});
		}
	}
</script>

<div
	class="flex items-center justify-center flex-col h-full"
	style="height: calc(100vh - 8rem);"
>
	<input
		class="input text-4xl"
		id="input"
		type="text"
		bind:value={code}
		inputmode="numeric"
		pattern="\d{6}"
		placeholder="  totp code"
		required
		minlength="6"
		maxlength="6"
	/>
	<button
		transition:fly
		class="button border-green absolute"
		style="top: calc({y}vh - 1rem); left: calc({x}vw - 1rem);"
		on:mouseenter={move}
		on:click={verify_code}>verify</button
	>
</div>
