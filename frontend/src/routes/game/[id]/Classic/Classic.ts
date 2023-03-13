import { Net } from "../Net";
import type { BallObject, PaddleObject, PingEvent, MouseEvent, Snapshot, Options } from "../lib2D/interfaces";
import { Vector, intersection, paddleBounce } from "../lib2D/Math2D";
import type { Line } from "../lib2D/Math2D";
import { Team } from "../lib2D/Team";

export const WIDTH = 160;
export const HEIGHT = 90;
export const UPS = 60;
export const PADDLE_PING_TIMEOUT = 120;
export const PADDLE_PING_INTERVAL = 60;

const paddleHitSound = new Audio("/Assets/sounds/hitClassic.wav");
const wallHitSound = new Audio("/Assets/sounds/wallClassic.wav");
const scoreSound = new Audio("/Assets/sounds/buzz.mp3");

export class Ball {
	public position: Vector;
	public velocity: Vector;

	public constructor() {
		this.position = new Vector(WIDTH / 2, HEIGHT / 2);
		this.velocity = new Vector(-1, 0);
	}

	public render(context: CanvasRenderingContext2D) {
		context.fillStyle = "white";
		context.fillRect(Math.floor(this.position.x) - 1, Math.floor(this.position.y) - 1, 2, 2);
	}

	public save(): BallObject {
		return {
			position: this.position.save(),
			velocity: this.velocity.save(),
		};
	}

	public collision(lines: Line[]): [Line, Vector, number] | null {
		let closest: [Line, Vector, number] | null = null;

		for (let line of lines) {
			const [t0, t1] = intersection([this.position, this.velocity], [line.p0, line.p1.sub(line.p0)])

			if (t1 >= 0 && t1 <= 1 && t0 > 0.001) {
				if (closest === null || t0 < closest[2]) {
					const pos = this.position.add(this.velocity.scale(t0));
					closest = [line, pos, t0];
				}
			}
		}

		return closest;
	}

	public load(object: BallObject) {
		this.position = Vector.load(object.position);
		this.velocity = Vector.load(object.velocity);
	}
}

export class Paddle {
	public position: Vector;
	public height: number;
	public userID?: number;
	public ping: number;
	public team: Team;

	public constructor(team: Team, side: "left" | "right") {
		if (side === "left") {
			this.position = new Vector(8, HEIGHT / 2);
		} else {
			this.position = new Vector(WIDTH - 8, HEIGHT / 2);
		}

		this.team = team;
		this.height = 20;
		this.ping = 0;
	}

	public render(context: CanvasRenderingContext2D) {
		context.fillStyle = "white";
		context.fillRect(Math.floor(this.position.x) - 1, Math.floor(this.position.y) - this.height / 2, 2, this.height);
	}

	public save(): PaddleObject {
		return {
			position: this.position.save(),
			height: this.height,
			userID: this.userID,
			width: 0, //width only needed for the modern pong
			ping: this.ping,
			rotation: 0
		};
	}

	public load(object: PaddleObject) {
		this.position = Vector.load(object.position);
		this.height = object.height;
		this.userID = object.userID;
		this.ping = object.ping;
	}
}

export class Game extends Net {
	public ball: Ball;
	public paddles: Array<Paddle>;
	public teams: Array<Team>;

	public constructor() {
		super();

		this.ball = new Ball();
		this.paddles = [];
		this.teams = [];

		this.on("move", netEvent => {
			const event = netEvent as MouseEvent;
			let paddle = this.getPaddle(event.u);

			if (paddle === null) {
				paddle = this.paddles.find(p => p.team.id == event.t) ?? null;

				if (paddle?.userID !== undefined) {
					paddle = null;
				}
			}

			if (paddle !== null) {
				paddle.userID = event.u;
				paddle.ping = this.time;
				paddle.position.y = event.y;
			}
		});

		this.on("ping", netEvent => {
			const event = netEvent as PingEvent;
			const paddle = this.getPaddle(event.u);

			if (paddle !== null) {
				paddle.ping = this.time;
			}
		});
	}

	protected save(): Snapshot {
		return {
			ball: this.ball.save(),
			paddles: this.paddles.map(paddle => paddle.save()),
			state: {
				teams: this.teams.map(team => team.save()),
			},
			...super.save(),
		};
	}

	protected load(snapshot: Snapshot) {
		this.ball.load(snapshot.ball);
		this.paddles.forEach((paddle, i) => paddle.load(snapshot.paddles[i]));
		this.teams.forEach((team, i) => team.load(snapshot.state.teams[i]));
		super.load(snapshot);
	}

	public getPaddle(userID?: number): Paddle | null {
		for (let paddle of this.paddles) {
			if (paddle.userID === userID) {
				return paddle;
			}
		}

		return null;
	}

	public render(context: CanvasRenderingContext2D) {
		context.fillStyle = "black";
		context.fillRect(0, 0, WIDTH, HEIGHT);
		context.lineWidth = 2;
		context.beginPath();
		context.setLineDash([2,2]);
		context.moveTo(WIDTH / 2, 0);
		context.lineTo(WIDTH / 2, HEIGHT);
		context.strokeStyle = "white";
		context.stroke();
		context.closePath();
		context.fillStyle = "white";
		context.font = "10px pong"; /* needs to be a multiple of 5 */
		context.fillText(this.teams[0].score.toString(), WIDTH / 4, 14);
		context.fillText(this.teams[1].score.toString(), 3 * WIDTH / 4, 14);
	
		this.ball.render(context);
		this.paddles.forEach(paddle => paddle.render(context));
	}

	public lateTick() {
		let time = 1;
		while (time > 0) {
			const collision = this.ball.collision([
				{ name: "wall-top", p0: new Vector(0, 0), p1: new Vector(WIDTH, 0) },
				{ name: "wall-bottom", p0: new Vector(0, HEIGHT), p1: new Vector(WIDTH, HEIGHT) },
				{ name: "wall-left", p0: new Vector(0, 0), p1: new Vector(0, HEIGHT) },
				{ name: "wall-right", p0: new Vector(WIDTH, 0), p1: new Vector(WIDTH, HEIGHT) },
				{ name: "paddle-left", p0: new Vector(this.paddles[0].position.x, this.paddles[0].position.y - this.paddles[0].height / 2), p1: new Vector(this.paddles[0].position.x, this.paddles[0].position.y + this.paddles[0].height / 2) },
				{ name: "paddle-right", p0: new Vector(this.paddles[1].position.x, this.paddles[1].position.y - this.paddles[1].height / 2), p1: new Vector(this.paddles[1].position.x, this.paddles[1].position.y + this.paddles[1].height / 2) },
			]);

			if (collision === null || collision[2] > time + 0.001) {
				this.ball.position = this.ball.position.add(this.ball.velocity.scale(time));
				break;
			} else if (collision[0].name == "wall-left") {
				this.teams[1].score += 1;
				this.pray("score-sound", 30, () => scoreSound.play());
				this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);
				this.ball.velocity = new Vector(1, 0);
				break;
			} else if (collision[0].name == "wall-right") {
				this.teams[0].score += 1;
				this.pray("score-sound", 30, () => scoreSound.play());
				this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);
				this.ball.velocity = new Vector(-1, 0);
				break;
			} else {
				this.ball.position = collision[1];
				this.ball.velocity = this.ball.velocity.reflect(collision[0].p1.sub(collision[0].p0));

				if (collision[0].name.startsWith("paddle-")) {
					this.pray("paddle-sound", 30, () => {
						console.log("played");
						paddleHitSound.play()
					});
					const magnitude = this.ball.velocity.magnitude() + 0.1;
					this.ball.velocity = this.ball.velocity.normalize();
					this.ball.velocity = paddleBounce(collision[0], this.ball);
					this.ball.velocity = this.ball.velocity.normalize().scale(magnitude);
				} else {
					this.pray("wall-sound", 30, () => wallHitSound.play());
				}

				time -= collision[2];
			}
		}
		
		for (let paddle of this.paddles) {
			if (paddle.ping + PADDLE_PING_TIMEOUT < this.time) {
				paddle.userID = undefined;
			}
		}
		super.lateTick();
	}

	public async start(options: Options) {
		const teams = options.room.teams;

		this.teams = [
			new Team(teams[0].id, teams[0].score),
			new Team(teams[1].id, teams[1].score),
		];

		this.paddles = [
			new Paddle(this.teams[0], "left"),
			new Paddle(this.teams[1], "right"),
		];

		super.start(options);
	}
}

export class Classic {
	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;
	private game: Game;
	private lastTime?: number;
	// private interval?: NodeJS.Timer;
	private interval?: number;
	private options?: Options;

	public constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.canvas.width = WIDTH;
		this.canvas.height = HEIGHT;
		this.context = canvas.getContext("2d")!;
		this.game = new Game();
	}

	public update(time: number) {
		this.lastTime ||= time;

		while (time - this.lastTime > 1000 / UPS) {
			this.game.tick();
			this.lastTime += 1000 / UPS;
		}

		const xScale = Math.floor(this.canvas.width / WIDTH);
		const yScale = Math.floor(this.canvas.height / HEIGHT);
		const minScale = Math.min(xScale, yScale);
		const xOffset = Math.floor((this.canvas.width - WIDTH * minScale) / 2);
		const yOffset = Math.floor((this.canvas.height - HEIGHT * minScale) / 2);
		
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.context.save();
		this.context.translate(xOffset, yOffset);
		this.context.scale(minScale, minScale);
		this.game.render(this.context);
		this.context.restore();

		/*
		this.context.fillStyle = "red";
		this.context.font = "16px Arial";
		this.context.fillText(`ping: ${Math.floor(this.game.latencyNetwork.averageOverSamples())}ms`, 0, 16);
		this.context.fillText(`down: ${Math.floor(this.game.bandwidthDownload.averageOverTime())}Bps`, 0, 32);
		this.context.fillText(`up: ${Math.floor(this.game.bandwidthUpload.averageOverTime())}Bps`, 0, 48);
		this.context.fillText(`tick: ${Math.floor(this.game.tickCounter.averageOverTime())}ps`, 0, 64);
		*/
	}

	public mousemove(offsetX: number, offsetY: number) {
		if (!this.options) {
			return;
		}

		const xScale = Math.floor(this.canvas.width / WIDTH);
		const yScale = Math.floor(this.canvas.height / HEIGHT);
		const minScale = Math.min(xScale, yScale);
		const xOffset = Math.floor((this.canvas.width - WIDTH * minScale) / 2);
		const yOffset = Math.floor((this.canvas.height - HEIGHT * minScale) / 2);
		const x = Math.floor((offsetX - xOffset) / minScale);
		const y = Math.floor((offsetY - yOffset) / minScale);

		if (this.options.member.player != null) {
			this.game.send("move", {
				u: this.options.member.userId,
				t: this.options.member.player?.teamId,
				y,
			});
		}

	}

	public async start(options: Options) {
		this.options = options;

		this.interval = setInterval(() => {
			this.game.send("ping", {
				u: options.member.userId,
			});
		}, 1000 / PADDLE_PING_INTERVAL);

		await this.game.start(options);
	}

	public async stop() {
		this.game.stop(); //this is needed otherwise it won't stop properly if you go to other page
		clearInterval(this.interval);
	}
}
