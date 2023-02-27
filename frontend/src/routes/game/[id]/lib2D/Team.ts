
import type { TeamObject } from "./interfaces";

export class Team {
	public score: number;
	public id: number;
    public userId?: number;
    public ping: number;

	public constructor(id: number) {
		this.score = 0;
		this.id = id;
        this.ping = 0;
	}

    public save(): TeamObject{
        return {
            s: this.score,
            i: this.id,
            u: this.userId,
            p: this.ping,
        }
    }

    public load(object: TeamObject) {
        this.id = object.i;
        this.score = object.s;
        this.userId = object.u;
        this.ping = object.p;
    }
}