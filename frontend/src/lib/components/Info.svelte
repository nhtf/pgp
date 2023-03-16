<script lang="ts">
	import type { UpdatePacket } from "$lib/types";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { put } from "$lib/Web";
    import { userStore } from "$lib/stores";
    import { onDestroy, onMount } from "svelte";
    import { updateManager } from "$lib/updateSocket";
    import { Subject } from "$lib/enums";
	import Avatar from "./Avatar.svelte";
	import Achievements from "./Achievements.svelte";
	import Swal from "sweetalert2";
	import "@sweetalert2/theme-dark/dark.scss";
	import * as validator from "validator";
    import { swal } from "$lib/Alert";

	const edit_icon = "/Assets/icons/pen.png";

	let index: number;

	$: profile = $userStore.get($page.data.profile.id)!;

	onMount(() => {
		index = updateManager.set(Subject.USER, async (update: UpdatePacket) => {
			if (update.id === profile.id && update.value.username && update.value.username !== $page.params.username) {
				await goto(`/profile/${encodeURIComponent(update.value.username)}`);
			}
		});
	});

	onDestroy(() => {
		updateManager.remove(index);
	})

	function clickfunction(event: MouseEvent) {
		if (!event || !event.target)
			return;
		const element = event.target as Element;
		if (!element.matches(".icon") && !element.matches(".achievement_cell") && !element.matches(".icon-block")) {
			const achievements = document.getElementsByClassName("achievement-display");
			for (let i = 0; i < achievements.length; i += 1) {
				const ach = achievements[i] as HTMLElement;
				ach.style.display = "none";
			}
		}
	}

	async function changeUsername() {
		await swal().fire({
			title: "Change username",
			input: "text",
			showCancelButton: true,
			confirmButtonText: "Set username",
			showLoaderOnConfirm: true,
			inputAutoTrim: true,
			inputPlaceholder: "Enter new username",
			allowOutsideClick: () => !Swal.isLoading(),
			inputValidator: (username) => {
				if (!validator.default.isLength(username, { min: 3, max: 20 }))
					return "Username must be at least 3, and max 20 characters";
				if (!/^(?!\0)\S(?:(?!\0)[ \S]){1,18}(?!\0)\S$/.test(username))
					return "Username may not contain tabs, newlines etc.";
				return null;
			},
			preConfirm: async (username) => {
				return await put("/user/me/username", { username }, true).catch(error => {
						Swal.showValidationMessage(error.message);
					});
			},
		});
	}
</script>

<svelte:window on:click={clickfunction}/>

<div class="block-vert" id="info">
	<div class="block-hor" id="user-block">
		<div class="block-cell" id="user-name-block">
			<div class="block-hor">
				<h1>{profile.username}</h1>
				{#if $page.data.user?.id === profile.id}
					<img src={edit_icon} alt="edit icon" id="edit-icon"
					on:click={changeUsername}
					on:keypress={changeUsername}
					/>
				{/if}
			</div>
			<div class="block-hor" id="level-hor">
				<div class="block-cell" id="level-block">
					<div class="block-hor" id="level-text">33</div>
					<div class="block-hor" id="level-text">Level</div>
				</div>
				<div class="block-cell" id="level-block-bar">
					<div class="block-hor" id="level-bar">
						<div class="border">
							<div class="bar" style="height:18px;width:20%" />
						</div>
					</div>
					<div class="block-hor" id="level-exp">123/12345 exp</div>
				</div>
			</div>
		</div>
		<Avatar user={profile}/>
	</div>
	<div class="block-hor">
		<div class="block-cell">
			<Achievements/>
		</div>
	</div>
	<div class="block-hor">
		<div class="block-cell">
			<h3>Last game played</h3>
			<div class="block-hor" id="legend">
				<div class="block-cell table-cell" id="no-grow">opponent</div>
				<div class="block-cell table-cell">me</div>
				<!-- <div class="block-cell">other stats</div> -->
			</div>
			<div class="block-hor" id="content">
				<div class="block-cell table-cell" id="no-grow">5</div>
				<div class="block-cell table-cell">3</div>
				<!-- <div class="block-cell table-cell">nope</div> -->
			</div>
		</div>
	</div>
	{#if !$page.data.user?.in_game}
		<div class="block-hor">
			<div class="block-cell">
				<p>Current game stats</p>
			</div>
		</div>
	{/if}
</div>

<style>


#edit-icon {
		max-width: 50px;
		max-height: 50px;
		position: relative;
		top: 0.5rem;
		right: 0.5rem;
		cursor: pointer;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		border-radius: 1rem;
		scale: 0.375;
	}

	#edit-icon:hover {
		box-shadow: 0px 0px 1px 1px var(--shadow-color);
	}

	#user-name-block {
		padding: 0;
		padding-right: 3px;
	}

	.table-cell {
		/* border: 1px solid var(--border-color);
		border-radius: 6px; */
		/* box-shadow: 1px 1px 1px 1px var(--hover-color); */
		min-height: 25px;
	}

	#content {
		border-radius: 6px;
		height: 30px;
		max-width: 250px;
	}

	#legend {
        background: var(--box-color);
		border-radius: 6px;
		height: 30px;
        /* box-shadow: 0 0 0 var(--box-color); */
		box-shadow: 2px 3px 5px 2px rgba(0, 0, 0, 0.4);
		margin-bottom: 5px;
		max-width: 250px;
    }

	#no-grow {
		flex-grow: 0;
	}

	#user-block {
		width: -moz-available;
		width: -webkit-fill-available;
		padding-left: 0;
		padding-right: 0;
		padding-top: 15px;
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

	#level-text {
		padding: 0;
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
		height: 100%;
		padding-left: 5px;
		padding-right: 5px;
	}

	.block-vert {
		flex-grow: 0.1;
	}

	.block-hor {
		width: -moz-available;
		width: -webkit-fill-available;
	}

	.block-cell {
		flex-direction: column;
		min-width: 100px;
		min-height: 40px;
		padding: 5px;
	}

	.block-cell:first-child {
		flex-grow: 1;
		text-align: center;
	}

</style>
