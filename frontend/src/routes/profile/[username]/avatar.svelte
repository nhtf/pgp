<script lang="ts">

	import { page } from "$app/stores";
    import Swal from "sweetalert2";
    import { put } from "$lib/Web";

    const edit_icon = "/Assets/icons/pen.png";
	let show_edit = false;
	$: avatar = $page.data?.profile?.avatar;
	let src: string | null;
	let filevar: FileList;

	// console.log($page.data.profile.avatar);

	async function changeAvatar() {
		const { value: file } = await Swal.fire({
				title: "Select image",
				input: "file",
				showCancelButton: true,
				confirmButtonText: "Select",
				inputAttributes: {
					"accept": "image/*",
					"aria-label": "Upload your avatar",
				},
				inputValidator: file => {
					if (!file)
						return "No file selected";
					if (file.size > 10485760)
						return "May not be larger than 10 MiB";
					return null;
				},
			});
		
		if (file) {
			const reader = new FileReader();
			reader.onload = async (e) => {
				await Swal.fire({
					title: "Change avatar",
					imageUrl: (e.target?.result as string),
					imageWidth: 400,
					imageHeight: 400,
					imageAlt: "Uploaded image",
					showCancelButton: true,
					preConfirm: () => {
						const form = new FormData();
						form.append("avatar", file);
						return put("/user/me/avatar", form, false).catch(error => {
							Swal.showValidationMessage(error.message);
						});
					},
				}).then(result => {
					if (result.isConfirmed) {
						const avatars = document.getElementById("avatar-menu") as HTMLImageElement;
						avatars.src = result.value.avatar;
						avatar = result.value.avatar;
						src = null;
						Swal.fire({
							position: "top-end",
							icon: "success",
							title: "Set new image",
							showConfirmButton: false,
							timer: 1300,
						});
					}
				});
			};
			reader.readAsDataURL(file);
		}
	}

</script>

<div class="block-cell" id="avatar-block">
	<img id="avatar" src={avatar} alt="avatar" />
    {#if $page.data.user?.username === $page.data.profile?.username}
        <img src={edit_icon} alt="edit icon" id="edit-icon"
            on:click={changeAvatar}
            on:keypress={changeAvatar}
        />
    {/if}
</div>

<style>
    .edit-avatar-window {
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

    #avatar-block {
		height: 100%;
		padding:0;
	}

    .hidden {
		display: none;
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
		right: -35px;
		cursor: pointer;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		border-radius: 6px;
	}

	#edit-icon:hover {
		box-shadow: 1px 1px 1px 1px var(--shadow-color);
	}

	.block-cell {
		flex-direction: column;
		min-width: 100px;
		min-height: 40px;
		padding: 5px;
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
    }
</style>
