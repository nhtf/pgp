export interface PlayerObject {
	user: number;
	team: number;
}

export interface TeamObject {
	score: number;
}

export interface Snapshot {
	players: PlayerObject[],
	teams: TeamObject[],
	state: string;
	current: number;
}

export class Player {
	public state: State;
	public user: number;
	public team: Team;

	public constructor(state: State, user: number, team: number) {
		this.state = state;
		this.user = user;
		this.team = state.teams[team];
	}
}

export class Team {
	public state: State;
	public score: number;

	public constructor(state: State) {
		this.state = state;
		this.score = 0;
	}

	public get players(): Player[] {
		return this.state.players.filter(player => player.team == this);
	}

	public get other(): Team {
		return this.state.teams.find(team => team != this)!;
	}
}

export class State {
	public players: Player[];
	public teams: Team[];
	public state: string;
	public current: Team;

	public constructor() {
		this.players = [];
		this.teams = [];
		this.teams.push(new Team(this));
		this.teams.push(new Team(this));
		this.state = "serve-ball";
		this.current = this.teams[0];
	}

	public save(): Snapshot {
		const players = [];
		const teams = [];

		for (let player of this.players) {
			players.push({
				user: player.user,
				team: this.teams.indexOf(player.team),
			});
		}

		for (let team of this.teams) {
			teams.push({
				score: team.score,
			});
		}

		return {
			players,
			teams,
			state: this.state,
			current: this.teams.indexOf(this.current),
		};
	}

	public load(snapshot: Snapshot) {
		this.players = [];
		this.teams = [];

		for (let teamObject of snapshot.teams) {
			const team = new Team(this);
			team.score = teamObject.score;
			this.teams.push(team);
		}

		for (let playerObject of snapshot.players) {
			const player = new Player(this, playerObject.user, playerObject.team);
			this.players.push(player);
		}

		this.state = snapshot.state;
		this.current = this.teams[snapshot.current];
	}

	private point(team: Team) {
		team.score += 1;
		const total = this.teams.map(team => team.score).reduce((p, c) => p + c);
		this.state = "serve-ball";
		this.current = this.teams[Math.floor(total / 2) % this.teams.length];
		console.log(this.teams.map(team => `${team.score}`).join(" - "));
	}

	public onPaddleHit(user: number): boolean {
		const player = this.players.find(player => player.user == user)!;
		
		if (this.state == "serve-ball" && player.team == this.current) {
			this.state = "serve-paddle";
		} else if (this.state == "play-table" && player.team == this.current) {
			this.state = "play-paddle";
		} else {
			this.point(player.team.other);
			return false;
		}

		return true;
	}

	public onTableHit(teamIndex: number | null): boolean {
		const team = teamIndex === null ? null : this.teams[teamIndex];

		if (this.state == "serve-table" && team === null) {
			this.state = "serve-net";
		} else if (this.state == "serve-net" && team == this.current?.other) {
			this.state = "serve-ball";
			return false;
		} else if (this.state == "serve-paddle" && team == this.current) {
			this.state = "serve-table";
		} else if (this.state == "serve-table" && team == this.current?.other) {
			this.state = "play-table";
			this.current = this.current?.other;
		} else if (this.state == "play-paddle" && team == this.current?.other) {
			this.state = "play-table";
			this.current = this.current?.other;
		} else if (team !== null) {
			if (this.current !== undefined) {
				this.point(this.current.other);
			}

			return false;
		}

		return true;
	}

	public onFloorHit(): boolean {
		if (this.current !== undefined) {
			this.point(this.current.other);
		}

		return false;
	}
}
