import type { Entity } from "$lib/entities";
import { Game, User } from "$lib/entities";
import { updateStore } from "$lib/stores";
import { get } from "$lib/Web";

export function dedup<T extends Entity>(array: T[]): T[] {
	return [...(new Map(array.map((obj) => [obj.id, obj]))).values()]
}

export async function fetchGame(id: number) {
	const game: Game = await get(`/game/${id}/state`);
	const users = game.teams.map((team) => team.players).flat().map((player) => player.user);

	updateStore(Game, game);
	updateStore(User, users);
}

export function clamp(n: number, min: number, max: number): number {
	return n < min ? min : n > max ? max : n;
}
