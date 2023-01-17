<script lang="ts">
	import { _default_profile_image as profile_image } from "../../+layout";
	import { page } from "$app/stores";
	import { io } from 'socket.io-client';
	import type { PageData } from './$types';
	import Swal from "sweetalert2";
    import type { Invite } from "../../../stores";
	import Dropdownmenu from "../../../dropdownmenu.svelte";

	export let data: PageData;

	const add_friend = "/Assets/icons/add-friend.png";
	const remove_friend = "/Assets/icons/remove-friend.png";
	const pong_icon = "/Assets/icons/pong-icon.png";
	const edit_icon = "/Assets/icons/pen.png";

	let friends = data.friends;
	let show_edit = false;
	let avatar = data.user.avatar;
	let score = new Map();

	let invites: Invite[] = [];

	let filevar: FileList;

	function resetImage() {
		data.user.avatar = "http://localhost:3000/avatar/" + data.user_id + ".jpg";
	};


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
		console.log(upload);
		const result = await upload.json();
		if (upload.ok) {
			console.log(result);
			data.user.avatar = result.new_avatar;
			avatar = data.user.avatar;
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

	function toggleEdit() {
		show_edit = !show_edit;
		src = null;
	}

	function resetToggles() {
		var dropdowns = document.getElementsByClassName("dropdown-content");
		for (let i = 0; i < dropdowns.length; i++) {
			const dropDown = dropdowns[i] as HTMLElement;
			dropDown.style.display = "none";
		}
	}

	function clickfunction(event: MouseEvent) {
		if (!event || !event.target)
			return;
		const element = event.target as Element;
		if (!element.matches("#dropbtn"))
			resetToggles();
	}

	let src: string | null;

	function onChange() {
		var reader = new FileReader();
		reader.onload = function (e) {
			if (e.target && e.target.result)
				src = e.target.result as string;
		}
		reader.readAsDataURL(filevar[0]);
	}

	function checkGameScores() {
		let socket = io("ws://localhost:3000/game", {withCredentials: true});
		socket.on("connect", () => {socket.emit("join", {scope: "stat", room: "1"})});
		socket.on("status", (status) => {
			data.friends.forEach((user) => {
				if (status.players.length > 1 && status.teams.length > 1) {
					for (let i = 0; i < status.players.length; i+=1) {
					if (status.players[i].user === user.user_id) {
						const points = status.teams[0].score + " - " + status.teams[1].score;
						score.set(user.username, points);
						// console.log("setting something");
					}
				}
				}
				
			})
			score = score;
		});
	}

	checkGameScores();
</script>

<svelte:window on:click={clickfunction}/>

<div class="block_container">
	<div class="block_vert" id="info">
		<div class="block_hor" id="stretch">
			<div class="block_cell"><h1>{$page.params.username}</h1></div>
			<div class="block_cell" >
				{#if data.user.avatar}
					<img id="avatar" src={data.user.avatar} alt="avatar" />
				{:else}
					<img id="avatar" src={profile_image} alt="avatar" />
				{/if}
				{#if data.user.username === data.username}
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
						<img src={src} class="current-avatar"/>
						</div>
						<div class="image-selector" on:click={upload} on:keypress={upload}>submit
						</div>
					{/if}
					</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
	<div class="block_vert">
		<h1 >Friends</h1>
		{#if friends}
			{#each friends as { username, avatar, online, in_game }, index}
				<div class="block_hor" id="friend-hor">
					<div class="block_cell">
						<Dropdownmenu drop={{options: data.options.get(username), img: null}}/>
						{#if online && !in_game}
							<div class="block_hor" id="online">online</div>
						{:else if !in_game}
							<div class="block_hor" id="offline">offline</div>
						{:else}
							{#if score.has(username)}
							<div class="block_hor" id="in_game">playing</div>
							<div class="block_hor" id="scoredv">{score.get(username)}</div>
							{:else}
							<div class="block_hor" id="in_game">playing</div>
							{/if}
						{/if}
					</div>
					<div class="block_cell avatar-cell">
						<Dropdownmenu drop={{options: data.options.get(username), img: avatar}}/>
					</div>				
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	:global(body) {
		font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI",
			Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica,
			Arial, sans-serif;
	}

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
		box-shadow: 0 0 3px 2px rgba(var(--shadow-color));
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
		background: rgb(25, 30, 35);
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
		border-color: rgb(25, 30, 35);
		border-style: solid;
		overflow: hidden;
		
	}

	.current-avatar {
		position: relative;
		width: auto;
		max-height: 250px;
		object-fit: contain;
	}

	.block_container {
		display: flex;
		gap: 10px;
		padding: 25px;
		flex-wrap: wrap;
		color: var(--text-color);
		text-decoration: none;
	}

	/* vertical blocks */
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

	#info {
		flex-grow: 3;
	}

	a {
		text-decoration: none;
	}

	#stretch {
		align-self: stretch;
	}

	/* horizontal blocks */
	.block_hor {
		display: flex;
		flex-direction: row;
		padding: 3px;
		justify-content: space-between;
		align-items: center;
		/* position: relative; */
		/* align-self: stretch; */
	}

	#profile_link:hover {
		box-shadow: 0 0 3px 2px rgba(var(--shadow-color));
		border-radius: 6px;
	}
	
	.hidden {
		display: none;
	}

	.block_cell {
		padding: 5px;
		justify-content: space-evenly;
		flex-grow: 0;
		min-width: 100px;
		min-height: 40px;
		/* max-height: 40px; */
		align-items: center;
		color: var(--text-color);
		text-decoration: none;
		text-align: center;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.avatar-cell {
		flex-grow: 1;
	}

	.block_cell:first-child {
		flex-grow: 1;
		text-align: center;
	}

	.small-avatars {
		max-width: 35px;
		max-height: 35px;
		border-radius: 50%;
		margin-right: 2em;
	}

	#invite {
		max-width: 35px;
		max-height: 35px;
		border-radius: 50%;
		margin-right: 2em;
		-webkit-filter: var(--invert);
		filter: var(--invert);
	}

	.small-avatars:hover {
		box-shadow: 2px 2px 5px 5px rgba(var(--shadow-color));
	}

	#invite:hover {
		box-shadow: 2px 2px 5px 5px rgba(var(--shadow-color));
	}

	#avatar {
		width: 100px;
		border-radius: 50%;
		z-index: 1;
	}

	#online,
	#offline,
	#in_game, #scoredv {
		position: relative;
		font-size: small;
		top: -5px;
		cursor:default;
		padding: 0;
	}

	#online{
		color: #5193af;
	}

	#offline {
		color: rgb(250, 93, 93);
	}

	#in_game, #scoredv {
		color: #88c5a4;
	}

	#scoredv {
		font-size: 10px;
		top: -5px;
	}

	#friend-hor {
		min-height: 55px;
		border: 2px solid var(--border-color);
		/* box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.4); */
	}

	#dropbtn {
		cursor: pointer;
		align-self: center;
		/* padding: 0; */
	}

	#dropbtn:hover {
		text-decoration: underline;
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
		box-shadow: 1px 1px 1px 1px rgba(var(--shadow-color));
	}

	::-webkit-scrollbar {
		background: var(--box-color);
		width: 11px;
		box-shadow: inset 0 0 10px 10px var(--scrollbar-bkg);
		border-top: solid 1px transparent;
		border-bottom: solid 1px transparent;
	}

	::-webkit-scrollbar-thumb {
		border-top: 3px solid transparent;
		border-left: 3px solid transparent;
		border-right: 2px solid transparent;
		border-bottom: 3px solid transparent;
		border-radius: 8px 8px 8px 8px;
		box-shadow: inset 12px 12px 12px 12px var(--scrollbar-thumb);
		margin: 0px auto;
	}
</style>
