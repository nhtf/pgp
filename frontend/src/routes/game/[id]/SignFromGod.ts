export class SignFromGod {
	public index: number;
	public era: number;

	public constructor(index: number = -1, era: number = -1) {
		this.index = index;
		this.era = era;
	}

	public isSignificantlyDifferent(other: SignFromGod | null, significance: number): boolean {
		return other === null || this.index > other.index || this.era - other.era > significance;
	}
}

export class Bible {
	private signsFromGod: Map<string, SignFromGod>;

	public constructor() {
		this.signsFromGod = new Map();
	}

	public read(subject: string): SignFromGod | null {
		return this.signsFromGod.get(subject) ?? null;
	}

	public revise(subject: string, signFromGod: SignFromGod) {
		this.signsFromGod.set(subject, signFromGod);
	}

	public publish(): Bible {
		const bible = new Bible();

		for (let subject in this.signsFromGod) {
			bible.revise(subject, this.read(subject)!);
		}

		return bible;
	}
}

export class Father {
	private currentBible: Bible;
	private oldBible: Bible;

	public constructor() {
		this.currentBible = new Bible();
		this.oldBible = new Bible();
	}

	public pray(subject: string, era: number, significance: number, callToAction: () => void) {
		const oldSignFromGod = this.oldBible.read(subject);
		const currentSignFromGod = this.currentBible.read(subject);
		const newSignFromGod = new SignFromGod((oldSignFromGod?.index ?? 0) + 1, era);

		if (newSignFromGod.isSignificantlyDifferent(currentSignFromGod, significance)) {
			this.currentBible.revise(subject, newSignFromGod);
			callToAction();
		}

		this.oldBible.revise(subject, newSignFromGod);
	}

	public publishBible(): Bible {
		return this.currentBible.publish();
	}

	public regress(bible: Bible) {
		this.oldBible = bible.publish();
	}
}
