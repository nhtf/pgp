<script lang="ts">
	import type { UpdatePacket } from "$lib/types";
	import type { Stat } from "$lib/entities";
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
	} from "flowbite-svelte";
	import { updateManager } from "$lib/updateSocket";
	import { onDestroy, onMount } from "svelte";
	import { userStore } from "$lib/stores";
	import { goto } from "$app/navigation";
	import { Subject, gamemodes } from "$lib/enums";
	import { icon_path } from "$lib/constants";
	import { page } from "$app/stores";
	import { put } from "$lib/Web";
	import Avatar from "./Avatar.svelte";
	import Swal from "sweetalert2";
	import * as validator from "validator";
	import "@sweetalert2/theme-dark/dark.scss";
	import AchievementBox from "./AchievementBox.svelte";

	const edit_icon = `${icon_path}/pen.png`;

	class Level {
		constructor(level: number) {
			this.level = level;
		}

		level: number;

		get floor(): number {
			return Math.floor(this.level);
		}

		get percentage(): number {
			return (this.level - this.floor) * 100;
		}

		get xp(): number {
			return Math.floor(10 ** this.level);
		}

		get xp_needed(): number {
			return 10 ** Math.ceil(this.level);
		}
	}

	let stats: Stat[];
	let index: number;

	$: profile = $userStore.get($page.data.profile.id)!;
	$: level = new Level($page.data.level);
	$: stats = $page.data.stats;
	$: modes = gamemodes.map((mode) => {
		return {
			...mode,
			...(stats.find(({ gamemode, team_count }) => {
				return gamemode === mode.gamemode && team_count === mode.team
			}) ?? { wins: 0, losses: 0, draws: 0 })
		}
	});


	onMount(() => {
		index = updateManager.set(Subject.USER, onUsernameChange);
	});

	onDestroy(() => {
		updateManager.remove(index);
	});

	async function onUsernameChange(update: UpdatePacket) {
		if (update.id === profile.id &&	update.value.username && update.value.username !== $page.params.username) {
			await goto(`/profile/${encodeURIComponent(update.value.username)}`);
		}
	}

	async function changeUsername() {
		await Swal.fire({
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
				return await put("/user/me/username", { username }).catch(
					(error) => {
						Swal.showValidationMessage(error.message);
					}
				);
			},
		});
	}
</script>

<div class="block-vert" id="info">
	<div class="block-hor" id="user-block">
		<div class="block-cell" id="user-name-block">
			<div class="block-hor">
				<h1>{profile.username}</h1>
				{#if $page.data.user?.id === profile.id}
					<img
						src={edit_icon}
						alt="edit icon"
						id="edit-icon"
						on:click={changeUsername}
						on:keypress={changeUsername}
					/>
				{/if}
			</div>
			<div class="block-hor" id="level-hor">
				<div class="block-cell" id="level-block">
					<div class="block-hor" id="level-text">Level</div>
					<div class="block-hor" id="level-text">{level.floor}</div>
				</div>
				<div class="block-cell" id="level-block-bar">
					<div class="block-hor" id="level-bar">
						<div class="border">
							<div
								class="bar"
								style="height:18px;width:{level.percentage}%"
							/>
						</div>
					</div>
					<div>{level.xp} / {level.xp_needed} xp</div>
				</div>
			</div>
		</div>
		<Avatar user={profile} />
	</div>
	<div class="block-hor">
		<div class="block-cell">
			<div class="block-hor"><h3>Achievements</h3></div>
			<div class="block-hor">
				{#each profile.achievements as achievement}
					<AchievementBox {achievement} />
				{/each}
			</div>
		</div>
	</div>
	<div class="flex gap-1">
		<Table>
			<TableHead>
				<TableHeadCell>gamemode</TableHeadCell>
				<!-- <TableHeadCell>teams</TableHeadCell> -->
				<TableHeadCell>wins</TableHeadCell>
				<TableHeadCell>losses</TableHeadCell>
				<TableHeadCell>draws</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each modes as mode}
					<TableBodyRow>
						<TableBodyCell>{mode.title}</TableBodyCell>
						<!-- <TableBodyCell>{stat.team_count}</TableBodyCell> -->
						<TableBodyCell>{mode.wins}</TableBodyCell>
						<TableBodyCell>{mode.losses}</TableBodyCell>
						<TableBodyCell>{mode.draws}</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</div>
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
