<script lang="ts">
	import type { PageData } from "./$types";
	import { page } from "$app/stores";
	export let data: PageData;
	import { _default_profile_image as profile_image } from "../../+layout";
	import Swal from "sweetalert2";

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
			if (e.target && e.target.result) src = e.target.result as string;
		};
		reader.readAsDataURL(filevar[0]);
	}

	//TODO use the web.ts post here
	async function upload() {
		const formData = new FormData();
		formData.append("file", filevar[0]);
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
		const upload = await data.fetch(
			"http://localhost:3000/account/set_image",
			{
				method: "POST",
				credentials: "include",
				mode: "cors",
				body: formData,
			}
		);
		const result = await upload.json();
		if (upload.ok) {
			data.user.avatar = result.new_avatar;

			const avatars = document.querySelectorAll("*");
			for (let i = 0; i < avatars.length; i += 1) {
				const imgsrc = avatars[i].getAttribute("src");
				if (imgsrc === avatar) {
					avatars[i].setAttribute("src", result.new_avatar);
				}
			}
			avatar = data.user.avatar;
			data.profile.avatar = avatar;
			const avatar_el = document.getElementById("small-avatar");
			if (avatar_el) {
				avatar_el.setAttribute("src", result.new_avatar);
			}
		} else {
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
				title: `${result}`,
			});
		}
		src = null;
		show_edit = false;
	}

	function showAchievementBlock(name: string) {
		console.log("clicker-noise");
		const achievements = document.getElementsByClassName("achievement-display");
		for (let i = 0; i < achievements.length; i += 1) {
			const ach = achievements[i] as HTMLElement;
			ach.style.display = "none";
			if (ach.id === name) {
				ach.style.display = "flex";
			}
		}
	}

	function clickfunction(event: MouseEvent) {
		if (!event || !event.target)
			return;
		const element = event.target as Element;
		if (!element.matches(".icon")) {
			const achievements = document.getElementsByClassName("achievement-display");
			for (let i = 0; i < achievements.length; i += 1) {
				const ach = achievements[i] as HTMLElement;
				ach.style.display = "none";
			}
		}
	}
	const cirmum = 30 * 2 * Math.PI;
</script>

<svelte:window on:click={clickfunction}/>

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
							<div class="bar" style="height:18px;width:20%" />
						</div>
					</div>
					<div class="block_hor" id="level-exp">123/12345 exp</div>
				</div>
			</div>
		</div>
		<div class="block_cell" id="avatar-block">
			{#if data.profile.avatar}
				<img id="avatar" src={data.profile.avatar} alt="avatar" />
			{:else}
				<img id="avatar" src={profile_image} alt="avatar" />
			{/if}
			{#if data.user.username === data.profile.username}
				<img
					on:click={toggleEdit}
					on:keypress={toggleEdit}
					src={edit_icon}
					alt="edit icon"
					id="edit-icon"
				/>
				{#if show_edit}
					<div class="edit-avatar-window">
						<div class="close-button">
							<svg
								on:click={toggleEdit}
								on:keypress={toggleEdit}
								fill="currentColor"
								width="24"
								height="24"
							>
								<path d="M13.42 12L20 18.58 18.58 20 12 13.42 5.42 20 4 18.58 10.58 12 4 5.42 5.42 4 12 10.58 18.58 4 20 5.42z"/>
							</svg>
						</div>
						{#if !src}
							<div class="avatar-preview-container">
								<img class="current-avatar" src={data.profile.avatar} alt="avatar"/>
							</div>
							<div class="image-selector">
								<input
									name="file"
									class="hidden"
									id="image-selector_file_upload"
									type="file"
									accept="image/*"
									bind:files={filevar}
									on:change={onChange}
								/>
								<label for="image-selector_file_upload">edit avatar</label>
							</div>
						{/if}
						{#if src}
							<div class="avatar-preview-container">
								<img {src} class="current-avatar" alt="" />
							</div>
							<div
								class="image-selector" on:click={upload} on:keypress={upload}>
								submit
							</div>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</div>
	<div class="block_hor">
		<div class="block_cell">
			<div class="block_hor"><h3>Achievements</h3></div>
			<div class="block_hor" id="wrap">
				{#if data.profile.achievements}
					{#each data.profile.achievements as { name, have, icon, level, progress, level_cost, text }}
						{#if have}
							<div class="achievement_cell" id="achievement-icon" 
								on:click={() => showAchievementBlock(name)}
								on:keypress={() => showAchievementBlock(name)}>
								<div class="block_hor icon-block" id="icon-block{level}">
									<div class="icon" id="ach-level{level}" 
										title={name}
										style="
											mask-image: url({icon});
											-webkit-mask-image: url({icon})"></div>
								</div>
								<div class="block_hor">
								<div class="border" id="ach-border">
									{#if level < 3}
									<div class="bar" id="ach-bar" style="height:5px;width:calc({progress/level_cost[level] * 100}%)" />
									{:else}
									<div class="bar" id="ach-bar-full" style="height:3px;width:100%" />
									{/if}
									<div class="test">
									<div class="achievement-display" id="{name}">
										<div class="achievement_cell" id="fit">
											<div class="block_hor"><b>{name}</b></div>
										<div class="block_hor" id="big">
										<div class="icon-block-big" id="icon-block{level}">
											<svg class="prog-ring">
												<circle 
												class="prog-ring__circle" 
												r="30" cx="25" cy="25"
												style:stroke-dashoffset={cirmum - progress/level_cost[level] * cirmum}
												/>
											</svg>
											<div class="icon move" id="ach-level{level}"
												title={name}
												style="mask-image: url({icon});-webkit-mask-image: url({icon}) top: -50px;">
											</div>
										</div>
										</div>
										{#if level < 3}
										<div class="block_hor">
											{progress}/{level_cost[level]}
										</div>
										{/if}
										<div class="block_hor">
										{text[level]}
										</div>
									</div>
								</div>
									</div>
								</div>
								</div>
							</div>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>

	.move {
		top: -52px;
	}

	.prog-ring {
		width: 50px;
		height: 50px;
		overflow: visible;
		position: relative;
	}

	.prog-ring__circle {
		stroke: var(--progress-color);
		stroke-width: 3;
		fill: transparent;
		transition: 0.35s stroke-dashoffset;
		transform: rotate(-90deg);
		transform-origin: 50% 50%;
		stroke-dasharray: var(--circumference) var(--circumference);
	}

	b {
		font-size:xx-large;
	}

	#fit {
		width: 100%;
		height: 100%;
	}

	.test {
		display: flex;
		position: relative;
		margin: 0 auto;
		justify-content: center;
		align-items: center;
		align-self: center;
		
	}

	#big {
		scale: 3;
		width: auto;
		/* padding-bottom: 15px;
		align-items: flex-start; */
	}

	.achievement-display {
		display: none;
		position: fixed;
		flex-direction: column;
		width: 500px;
		height: 400px;
		background: var(--box-color);
		border-color: var(--border-color);
		border-radius: 10px;
		border-width: 2px;
		box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
		margin: 0;
		top: calc(50% - 200px);
		left: calc(50% - 250px);
		z-index: 20;
		justify-content: center;
		align-items: center;
	}

	#ach-border {
		display: flex;
		align-items: center;
		height: 0px;
		padding: 1px;
	}

	#ach-bar {
		position: relative;
		right: 1px;
		width: 110%;
	}

	#ach-bar-full {
		outline: 1px solid var(--bar-prog-color);
	}

	.icon-block {
		padding: 0;
		height: 50px;
		width: 50px;
		border: 4px solid gold;
		border-radius: 50%;
		outline: 2px solid silver;
		scale: 0.9;
	}

	.icon-block-big {
		padding: 0;
		height: 50px;
		width: 50px;
		border: 4px solid gold;
		border-radius: 50%;
		outline: 2px solid silver;
		scale: 0.9;
	}

	.icon-block:hover {
		box-shadow: 0px 0px 10px 10px var(--shadow-color);
	}

	#icon-block0 {
		border: 4px solid #967444;
		outline: 2px solid silver;
	}

	#icon-block1 {
		border: 4px solid silver;
		outline: 2px solid silver;
	}

	#icon-block2 {
		border: 4px solid gold;
		outline: 2px solid silver;
	}

	#icon-block3 {
		border: 4px solid #7eeee2;
		outline: 2px solid silver;
	}

	.icon {
		background-color: #967444;
		width: 50px;
		height: 50px;
		scale: 0.7;
		display: flex;
		/* top: -50px; */
		position: relative;
	}

	#achievement-icon {
		padding: 2px;
	}

	#ach-level0 {
		outline: 3px solid #967444;
		background-color: #967444;
	}

	#ach-level1 {
		outline: 3px solid silver;
		background-color: silver;
	}

	#ach-level2 {
		outline: 3px solid gold;
		background-color: gold;
	}

	#ach-level3 {
		outline: 3px solid #7eeee2;
		background-color: #7eeee2;
	}

	.achievement_cell {
		display: flex;
		align-items: center;
		text-align: center;
		position: relative;
		color: var(--text-color);
		justify-content: space-around;
		flex-direction: column;
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
		width: -webkit-fill-available;
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
		background: var(--bar-prog-color);
		border-radius: 10px;
	}

	.border {
		background: var(--bar-bkg-color);
		border: 1px solid var(--hover-color);
		border-radius: 10px;
		width: 100%;
	}

	#info {
		flex-grow: 3;
		max-width: 600px;
	}

	.hidden {
		display: none;
	}

	#wrap {
		flex-wrap: wrap;
	}

	.block_vert {
		flex-grow: 0.1;
	}

	.block_hor {
		width: -moz-available;
		width: -webkit-fill-available;
	}

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

	#edit-icon:hover {
		box-shadow: 1px 1px 1px 1px var(--shadow-color);
	}

	@media (max-width: 750px) {
        .achievement-display {
			width: 250px;
			height: 250px;
			top: calc(50% - 125px);
			left: calc(50% - 125px);
		}

		#big {
			scale: 2;
			width: auto;
			height: 120px;
			/* padding-bottom: 15px; */
		}

		b {
			font-size: large;
		}
    }
</style>
