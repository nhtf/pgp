
import type { TeamObject } from "./interfaces";

export class Team {
	public score: number;
	public id: number;
    public userId?: number;
    public ping: number;
    public active: boolean | undefined;

	public constructor(id: number, active: boolean | undefined, score?: number) {
		this.score = score === undefined ? 0 : score;
		this.id = id;
        this.ping = 0;
        this.active = active;
	}

    public save(): TeamObject {
        return {
            score: this.score,
            id: this.id,
            user: this.userId,
            ping: this.ping,
            active: this.active,
        }
    }

    public load(object: TeamObject) {
        this.id = object.id;
        this.score = object.score;
        this.userId = object.user;
        this.ping = object.ping;
        this.active = object.active;
    }
}
