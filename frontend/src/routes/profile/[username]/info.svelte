<script lang="ts">
    import type { PageData } from './$types';
    import { page } from "$app/stores";
    export let data: PageData;
    import { _default_profile_image as profile_image } from "../../+layout";
    import Swal from "sweetalert2";

    const user = data.user;
    const edit_icon = "/Assets/icons/pen.png";
    let show_edit = false;
	let avatar = data.user.avatar;
    let src: string | null;
    let filevar: FileList;

    function toggleEdit() {
		show_edit = !show_edit;
		src = null;
	}

	function onChange() {
		var reader = new FileReader();
		reader.onload = function (e) {
			if (e.target && e.target.result)
				src = e.target.result as string;
		}
		reader.readAsDataURL(filevar[0]);
	}

    async function upload() {
		const formData = new FormData();
        formData.append('file', filevar[0]);
		if (filevar[0].size > 10485760) {
			const Toast = Swal.mixin({
				toast: true,
				position: 'bottom-end',
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: false,
				didOpen: (toast) => {
					toast.addEventListener('mouseenter', Swal.stopTimer);
					toast.addEventListener('mouseleave', Swal.resumeTimer);
				}
			});
			Toast.fire({
				icon: 'error',
				title: 'File is more than 10 MiB large'
			});
			return;
		}
        const upload = await data.fetch('http://localhost:3000/account/set_image', {
            method: 'POST',
			credentials: "include",
            mode: "cors",
            body: formData
        });
		const result = await upload.json();
		if (upload.ok) {
			data.user.avatar = result.new_avatar;
			
			const avatars = document.querySelectorAll("*");
			for (let i = 0; i < avatars.length; i+=1) {
				const imgsrc = avatars[i].getAttribute("src");
				if (imgsrc === avatar) {
					avatars[i].setAttribute("src", result.new_avatar);
				}
			}
			avatar = data.user.avatar;
			user.avatar = avatar;
			const avatar_el = document.getElementById('small-avatar');
			if (avatar_el) {
				avatar_el.setAttribute('src', result.new_avatar);
			}
		} else {
			const Toast = Swal.mixin({
				toast: true,
				position: 'bottom-end',
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: false,
				didOpen: (toast) => {
					toast.addEventListener('mouseenter', Swal.stopTimer);
					toast.addEventListener('mouseleave', Swal.resumeTimer);
				}
			});
			Toast.fire({
				icon: 'error',
				title: `${result}`
			});
		}
		src = null;
		show_edit = false;
    }
    //TODO make the achievements have different look depending on level (and maybe achievment also need progress bar)
</script>


<div class="block_vert" id="info">
    <div class="block_hor" id="user-block">
        <div class="block_cell">
            <div class="block_hor">
            <h1>{$page.params.username}</h1>
        </div>
        <div class="block_hor" id="level-hor">
            <div class="block_cell" id="level-block">
                <div class="block_hor" id="level-text">33</div>
                <div class="block_hor" id="level-text">Level</div>
            </div>
            <div class="block_cell" id="level-block-bar">
                <div class="block_hor" id="level-bar">
                    <div class="border">
                        <div class="bar" style="height:18px;width:20%"></div>
                    </div>
                </div>
                <div class="block_hor" id="level-exp">
                    123/12345 exp
                </div>
            </div>
        </div>
    </div>
        <div class="block_cell" id="avatar-block">
            {#if user.avatar}
                <img id="avatar" src={user.avatar} alt="avatar" />
            {:else}
                <img id="avatar" src={profile_image} alt="avatar" />
            {/if}
            {#if data.user.username === user.username}
                <img on:click={toggleEdit} on:keypress={toggleEdit} src={edit_icon} alt="edit icon" id="edit-icon"/>
                {#if show_edit}
                <div class="edit-avatar-window">
                    <div class="close-button">
                    <svg on:click={toggleEdit} on:keypress={toggleEdit} fill="currentColor" width="24" height="24">
                        <path d="M13.42 12L20 18.58 18.58 20 12 13.42 5.42 20 4 18.58 10.58 12 4 5.42 5.42 4 12 10.58 18.58 4 20 5.42z"></path>
                      </svg>
                    </div>
                    {#if !src}
                    <div class="avatar-preview-container">
                    <img class="current-avatar" src={data.user.avatar} alt="avatar" />
                    </div>
                    <div class="image-selector">
                        <input name="file" class="hidden" id="image-selector_file_upload" type="file" accept="image/*" bind:files={filevar} on:change={onChange}>
                        <label  for="image-selector_file_upload">edit avatar</label>
                    </div>
                {/if}
                {#if src}
                    <div class="avatar-preview-container">
                    <img src={src} class="current-avatar" alt=""/>
                    </div>
                    <div class="image-selector" on:click={upload} on:keypress={upload}>submit
                    </div>
                {/if}
                </div>
                {/if}
            {/if}
        </div>
    </div>
    <div class="block_hor">
        <div class="block_cell">
            <div class="block_hor"><h3>Achievments</h3></div>
            <div class="block_hor" id="wrap">
                {#if data.user.achievments}
                {#each data.user.achievments as {name, have, icon}}
                {#if have}
                    <div class="achievement_cell" id="achievment-icon">
                        <img class="small-avatars" src={icon} title={name} alt={name}>
                    </div>
                {/if}
                {/each}
                {/if}
            </div>
        </div>
    </div>
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
		justify-content: center;
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
		bottom: 30px;
		right: 10px;
		cursor: pointer;
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
		top: 20px;
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

    #user-block {
        width: -moz-available;
    }

    #avatar-block {
        height: 100%;
        padding-top: 0;
        padding-bottom: 0;
    }

    #level-block {
        max-width: 40px;
        min-width: 20px;
        height: 60px;
    }

    #level-bar {
        flex-grow: 1;
        padding-top: 0;
        padding-bottom: 0;
    }

    #level-block-bar {
        flex-grow: 1;
        height: 60px;
    }

    #level-exp {
        font-size: 12px;
        padding-top: 0;
        padding-bottom: 0;
        justify-content: flex-end;
    }

    .bar {
		background:var(--bar-prog-color);
        border-radius: 10px;
	}

	.border {
        background: var(--bar-bkg-color);
		border:1px solid var(--hover-color);
		border-radius: 10px;
		width: 100%;
	}

	#info {
		flex-grow: 3;
		max-width: 600px;
	}
	
	.hidden {display: none;}

	#wrap {
		flex-wrap: wrap;
	}

	.block_vert {flex-grow: 0.1;}

	.block_hor {width: -moz-available;}

	.block_cell {
		flex-direction: column;
		min-width: 100px;
		min-height: 40px;
		padding: 5px;
	}

	.block_cell:first-child {
		flex-grow: 1;
		text-align: center;
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

	#edit-icon:hover {box-shadow: 1px 1px 1px 1px var(--shadow-color);}

	#achievment-icon {
		width: 40px;
		height: 40px;
		min-width: 0;
		padding: 1px;
	}

    .achievement_cell {
        display: flex;
	align-items: center;
	text-align: center;
	position: relative;
	color: var(--text-color);
	justify-content: center;
    }
</style>