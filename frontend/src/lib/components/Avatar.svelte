<script lang="ts">
    import type { User } from "$lib/entities";
	import { page } from "$app/stores";
	import { put } from "$lib/Web";
	import Swal from "sweetalert2";

	export let user: User;

	const edit_icon = "/Assets/icons/pen.png";

	async function changeAvatar() {
		const { value: file } = await Swal.fire({
			title: "Select image",
			input: "file",
			showCancelButton: true,
			confirmButtonText: "Select",
			inputAttributes: {
				accept: "image/*",
				"aria-label": "Upload your avatar",
			},
			inputValidator: (file) => {
				if (!file) {
					return "No file selected";
				}
				return null;
			},
		});

		if (file) {
			const reader = new FileReader();
			reader.onload = async (event) => {
				await Swal.fire({
					title: "Change avatar?",
					imageUrl: event.target?.result as string,
					imageWidth: 400,
					imageHeight: 400,
					imageAlt: "Uploaded image",
					showCancelButton: true,
					preConfirm: async () => {
						const form = new FormData();
						form.append("avatar", file);
						return await put("/user/me/avatar", form, false).catch(
							(error) => {
								Swal.showValidationMessage(error.message);
							}
						);
					},
				});
			};
			reader.readAsDataURL(file);
		}
	}
</script>

<div class="block-cell" id="avatar-block">
	<img id="avatar" src={user.avatar} alt="avatar" />
	{#if user.id === $page.data.user?.id}
		<img
			src={edit_icon}
			alt="edit icon"
			id="edit-icon"
			on:click={changeAvatar}
			on:keypress={changeAvatar}
		/>
	{/if}
</div>

<style>
	#avatar-block {
		height: 100%;
		padding: 0;
	}

	#avatar {
		width: 120px;
		border-radius: 50%;
		z-index: 1;
	}

	#edit-icon {
		max-width: 25px;
		max-height: 25px;
		position: relative;
		top: -10px;
		right: -45px;
		cursor: pointer;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		border-radius: 10px;
	}

	#edit-icon:hover {
		box-shadow: 0px 0px 1px 1px var(--shadow-color);
	}

	.block-cell {
		flex-direction: column;
		min-width: 100px;
		min-height: 40px;
		padding: 5px;
	}
</style>
