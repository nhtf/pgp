<script lang="ts">

	import { page } from "$app/stores";
    import Swal from "sweetalert2";
    import { put } from "$lib/Web";

    const edit_icon = "/Assets/icons/pen.png";
	let show_edit = false;
	$: avatar = $page.data?.profile?.avatar; //TODO this is how to do stores properly
	let src: string | null;
	let filevar: FileList;

	console.log($page.data.profile.avatar);

	function toggleEdit() {
		show_edit = !show_edit;
		src = null;
	}

	function onChange() {
		var reader = new FileReader();
		reader.onload = function (e) {
			if (e.target && e.target.result) src = e.target.result as string;
		};
		reader.readAsDataURL(filevar[0]);
	}

	async function upload() {
		const formData = new FormData();
		formData.append("avatar", filevar[0]);
		if (filevar[0].size > 10485760) {
			const Toast = Swal.mixin({
				toast: true,
				position: "bottom-end",
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: false,
				didOpen: (toast) => {
					toast.addEventListener("mouseenter", Swal.stopTimer);
					toast.addEventListener("mouseleave", Swal.resumeTimer);
				},
			});
			Toast.fire({
				icon: "error",
				title: "File is more than 10 MiB large",
			});
			return;
		}
		const result = await put(`/user/me/avatar`, formData, false);
		const avatars = document.getElementById("avatar-menu") as HTMLImageElement;
		avatars.src = result.avatar;
		avatar = result.avatar;		
		src = null;
		show_edit = false;
	}

</script>

<div class="block-cell" id="avatar-block">
	<img id="avatar" src={avatar} alt="avatar" />
    {#if $page.data.user?.username === $page.data.profile?.username}
        <img src={edit_icon} alt="edit icon" id="edit-icon"
            on:click={toggleEdit}
            on:keypress={toggleEdit}
        />
        {#if show_edit}
        <div class="edit-avatar-window">
            <div class="close-button">
                <svg fill="currentColor" width="24" height="24"
                    on:click={toggleEdit}
                    on:keypress={toggleEdit}	
                >
                    <path d="M13.42 12L20 18.58 18.58 20 12 13.42
                            5.42 20 4 18.58 10.58 12 4 5.42 5.42
                            4 12 10.58 18.58 4 20 5.42z"/>
                </svg>
            </div>
            {#if !src}
                <div class="avatar-preview-container">
                    <img class="current-avatar" src={$page.data.profile.avatar} alt="avatar"/>
                </div>
                <div class="image-selector">
                    <input name="file" class="hidden" id="image-selector_file_upload"
                        type="file" accept="image/*" bind:files={filevar} on:change={onChange}
                    />
                    <label for="image-selector_file_upload">edit avatar</label>
                </div>
            {/if}
            {#if src}
                <div class="avatar-preview-container">
                    <img {src} class="current-avatar" alt="" />
                </div>
                <div class="image-selector" on:click={upload} on:keypress={upload}>
                    submit
                </div>
            {/if}
        </div>
        {/if}
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
		z-index: 20;
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