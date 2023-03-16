<script lang="ts">
    import type { User } from "$lib/entities";
	import { page } from "$app/stores";
	import { put } from "$lib/Web";
	import Swal from "sweetalert2";
    import { swal } from "$lib/Alert";

	export let user: User;

	const edit_icon = "/Assets/icons/pen.png";

	async function changeAvatar() {
		const { value: file } = await swal().fire({
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
				await swal().fire({
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
	/* .edit-avatar-window {
		display: flex;
		position: fixed;
		flex-direction: column;
		z-index: 25;
		top: calc(50% - 200px);
		left: calc(50% - 176px);
		background: var(--box-color);
		border-radius: 6px;
		border-width: 1px;
		border-color: var(--border-color);
		border-style: solid;
		box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
		width: 400px;
		height: 350px;
		justify-content: space-between;
		align-items: center;
		text-align: center;
		align-self: flex-end;
	}

	.close-button {
		display: flex;
		position: relative;
		align-self: flex-end;
		align-items: center;
		justify-content: center;
		top: 10px;
		right: 10px;
		cursor: pointer;
		margin-bottom: unset;
		left: unset;
	}

	.close-button:hover {
		box-shadow: 0 0 3px 2px var(--shadow-color);
		border-radius: 6px;
	}

	.image-selector {
		display: flex;
		position: relative;
		height: 30px;
		width: 100px;
		align-self: center;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		border-width: 1px;
		border-color: var(--scrollbar-thumb);
		border-style: solid;
		bottom: 20px;
		cursor: pointer;
	}

	.image-selector:hover {
		background: var(--tab-active-color);
	}

	.avatar-preview-container {
		display: flex;
		position: relative;
		align-self: center;
		align-items: center;
		justify-content: center;
		width: 200px;
		height: 200px;
		border-radius: 50%;
		border-width: 5px;
		border-color: var(--border-color);
		border-style: solid;
		overflow: hidden;
	}

	.current-avatar {
		position: relative;
		width: auto;
		max-height: 250px;
		object-fit: contain;
	}

	.hidden {
		display: none;
	}

	@media (max-width: 750px) {
		.edit-avatar-window {
			width: 250px;
			height: 250px;
			top: calc(50% - 125px);
			left: calc(50% - 125px);
		}

		.image-selector {
			bottom: 5px;
		}

		.avatar-preview-container {
			width: 150px;
			height: 150px;
		}
	} */

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
