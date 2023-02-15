function choice<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

export const genMaybeQuoted = str => choice([
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
])();

export const genCreature = () => choice([
	() => `dragon`,
	() => `unicorn`,
	() => `mermaid`,
	() => `werewolf`,
	() => `fairy`,
	() => `phoenix`,
	() => `goblin`,
	() => `skeleton`,
	() => `zombie`,
	() => `elf`,
	() => `dinosaur`,
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

export const genName = () => choice([
	() => `The ${genAdjectiveSequence()} ${genRoomSynonym()}`,
	() => `My ${genAdjectiveSequence()} ${genRoomSynonym()}`,
	() => `The ${genRoomSynonym()} of the ${genAdjectiveSequence()} ${genCreature()}`,
	() => `The ${genAdjectiveSequence()} ${genRoomSynonym()} of the ${genCreature()}`,
])();
