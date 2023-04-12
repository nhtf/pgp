import type { Entity } from "$lib/entities";

export function dedup<T extends Entity>(array: T[]): T[] {
	return [...(new Map(array.map((obj) => [obj.id, obj]))).values()]
}