function choice<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

export const genMaybeQuoted = (str: string) => choice([
	() => `${str}`,
	() => `${str}`,
	() => `${str}`,
	() => `${str}`,
	() => `${str}`,
	() => `${str}`,
	() => `${str}`,
	() => `"${str}"`,
])();

export const genAdverb = () => choice([
	() => `extremely`,
	() => `clearly`,
	() => `unexpectedly`,
	() => `very`,
	() => `sometimes`,
	() => `surprisingly`,
	() => `secretly`,
	() => `increasingly`,
])();

export const genCreature = (plural: boolean = false) => choice([
	() => plural ? `dragons` : `dragon`,
	() => plural ? `unicorns` : `unicorn`,
	() => plural ? `mermaids` : `mermaid`,
	() => plural ? `werewolves` : `werewolf`,
	() => plural ? `fairies` : `fairy`,
	() => plural ? `phoenixes` : `phoenix`,
	() => plural ? `goblins` : `goblin`,
	() => plural ? `skeletons` : `skeleton`,
	() => plural ? `zombies` : `zombie`,
	() => plural ? `elves` : `elf`,
	() => plural ? `dinosaurs` : `dinosaur`,
])();

export const genAdjective = () => choice([
	() => `adorable`,
	() => `angry`,
	() => `annoying`,
	() => `attractive`,
	() => `awful`,
	() => `beautiful`,
	() => `better`,
	() => `charming`,
	() => `clumsy`,
	() => `confusing`,
	() => `dangerous`,
	() => `dead`,
	() => `elegant`,
	() => `expensive`,
	() => `explosive`,
	() => `famous`,
	() => `fragile`,
	() => `friendly`,
	() => `fluffy`,
	() => `funny`,
	() => `happy`,
	() => `hilarious`,
	() => `horrifying`,
	() => `important`,
	() => `lucky`,
	() => `mysterious`,
	() => `moist`,
	() => `nasty`,
	() => `odd`,
	() => `overcomplicated`,
	() => `powerful`,
	() => `prickly`,
	() => `purple`,
	() => `repulsive`,
	() => `strange`,
	() => `stupid`,
	() => `superfluous`,
	() => `secret`,
	() => `tasty`,
	() => `unusual`,
	() => `ugly`,
	() => `wicked`,
])();

export const genRoomSynonym = () => choice([
	() => `room`,
	() => `space`,
	() => `area`,
	() => `realm`,
	() => `chamber`,
	() => `dungeon`,
	() => `house`,
])();

export const genAdverbAdjective = () => choice([
	() => `${genMaybeQuoted(`${genAdjective()}`)}`,
	() => `${genMaybeQuoted(`${genAdjective()}`)}`,
	() => `${genMaybeQuoted(`${genAdverb()} ${genAdjective()}`)}`,
])();

export const genAdjectiveSequence = () => choice([
	() => `${genAdverbAdjective()}`,
	() => `${genAdverbAdjective()}`,
	() => `${genAdverbAdjective()}, ${genAdjectiveSequence()}`,
])();

export const genNameUnlimited = () => choice([
	() => `The ${genAdjectiveSequence()} ${genRoomSynonym()}`,
	() => `My ${genAdjectiveSequence()} ${genRoomSynonym()}`,
	() => `The ${genRoomSynonym()} of the ${genAdjectiveSequence()} ${genCreature()}`,
	() => `The ${genAdjectiveSequence()} ${genRoomSynonym()} of the ${genCreature()}`,
])();

export const genTeamNameUnlimited = () => choice([
	() => `The ${genAdjectiveSequence()} ${genCreature(true)}`,
])();

export function genLimit(func: () => string, limit?: number): string {
	let name = func();

	if (limit !== undefined) {
		while (name.length > limit) {
			name = func();
		}
	}

	return name;
}

export function genName(limit?: number): string {
	return genLimit(genNameUnlimited, limit);
}

export function genTeamName(limit?: number): string {
	return genLimit(genTeamNameUnlimited, limit);
}
