import { Net } from "../Net";
import type { BallObject, PaddleObject, MouseEvent, Snapshot, Options } from "../lib2D/interfaces";
import {  Vector, intersection } from "../lib2D/Math2D";
import type {  Line } from "../lib2D/Math2D";

export const WIDTH = 160;
export const HEIGHT = 90;
export const UPS = 60;


export class Ball {
	public position: Vector;
	public velocity: Vector;

	public constructor() {
		this.position = new Vector(WIDTH / 2, HEIGHT / 2);
		this.velocity = new Vector(-1, 0);
	}

	public render(context: CanvasRenderingContext2D) {
		context.fillStyle = "white";
		context.fillRect(this.position.x - 1, this.position.y - 1, 2, 2);
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

	public constructor(side: "left" | "right") {
		if (side === "left") {
			this.position = new Vector(8, HEIGHT / 2);
		} else {
			this.position = new Vector(WIDTH - 8, HEIGHT / 2);
		}

		this.height = 20;
	}

	public render(context: CanvasRenderingContext2D) {
		context.fillStyle = "white";
		context.fillRect(this.position.x - 1, this.position.y - this.height / 2, 2, this.height);
	}

	public save(): PaddleObject {
		return {
			position: this.position.save(),
			height: this.height,
			userID: this.userID,
			width: 0, //width only needed for the modern pong
		};
	}

	public load(object: PaddleObject) {
		this.position = Vector.load(object.position);
		this.height = object.height;
		this.userID = object.userID;
	}
}

export class Game extends Net {
	public ball: Ball;
	public paddles: Array<Paddle>;

	public constructor() {
		super();

		this.ball = new Ball();
		this.paddles = [new Paddle("left"), new Paddle("right")];

		this.on("move", netEvent => {
			const event = netEvent as MouseEvent;
			let paddle = this.getPaddle(event.u) ?? this.getPaddle();

			if (paddle !== null) {
				paddle.userID = event.u;
				paddle.position.y = event.y;
			}
		});
	}

	protected save(): Snapshot {
		return {
			ball: this.ball.save(),
			paddles: this.paddles.map(paddle => paddle.save()),
			...super.save(),
		};
	}

	protected load(snapshot: Snapshot) {
		this.ball.load(snapshot.ball);
		this.paddles.forEach((paddle, i) => paddle.load(snapshot.paddles[i]));
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
				/* TODO: Point to team right */
				this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);
				this.ball.velocity = new Vector(1, 0);
				break;
			} else if (collision[0].name == "wall-right") {
				/* TODO: Point to team left */
				this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);
				this.ball.velocity = new Vector(-1, 0);
				break;
			} else if (collision[0].name == "paddle-left") {
				this.ball.position = collision[1];
				this.ball.velocity = this.ball.velocity.reflect(collision[0].p1.sub(collision[0].p0));
				const relAngle = Math.PI / 2 - Math.abs(Math.tan(this.ball.velocity.y / this.ball.velocity.x));
				const hit = (this.ball.position.y - this.paddles[0].position.y) / this.paddles[0].height;
				const angle = Math.atan2(this.ball.velocity.y, this.ball.velocity.x) + relAngle * hit;
				this.ball.velocity = new Vector(Math.cos(angle), Math.sin(angle)).scale(this.ball.velocity.magnitude() + 0.1);
				break;
			} else if (collision[0].name == "paddle-right") {
				this.ball.position = collision[1];
				this.ball.velocity = this.ball.velocity.reflect(collision[0].p1.sub(collision[0].p0));
				const relAngle = Math.PI / 2 - Math.abs(Math.tan(this.ball.velocity.y / this.ball.velocity.x));
				const hit = (this.ball.position.y - this.paddles[1].position.y) / this.paddles[1].height;
				const angle = Math.atan2(this.ball.velocity.y, this.ball.velocity.x) - relAngle * hit;
				this.ball.velocity = new Vector(Math.cos(angle), Math.sin(angle)).scale(this.ball.velocity.magnitude() + 0.1);
				break;
			} else {
				this.ball.position = collision[1];
				this.ball.velocity = this.ball.velocity.reflect(collision[0].p1.sub(collision[0].p0));
				time -= collision[2];
			}
		}

		/*
		this.ball.position.x += this.ball.velocity.x;
		this.ball.position.y += this.ball.velocity.y;

		if (this.ball.position.x < 8) {
			if (Math.abs(this.ball.position.y - this.paddles[0].position.y) > this.paddles[0].height / 2) {
				this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);
				this.ball.velocity = new Vector(1, 0);
			} else {
				const angle = (this.ball.position.y - this.paddles[0].position.y) / this.paddles[0].height * Math.PI * 0.75;
				const speed = Math.sqrt(Math.pow(this.ball.velocity.x, 2) + Math.pow(this.ball.velocity.y, 2)) * 1.1;
				this.ball.position.x = -this.ball.position.x + 16;
				this.ball.velocity.x = Math.cos(angle) * speed;
				this.ball.velocity.y = Math.sin(angle) * speed;
			}
		}

		if (this.ball.position.x > WIDTH - 8) {
			if (Math.abs(this.ball.position.y - this.paddles[1].position.y) > this.paddles[1].height / 2) {
				this.ball.velocity = new Vector(-1, 0);
				this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);
			} else {
				const angle = (this.ball.position.y - this.paddles[1].position.y) / this.paddles[1].height * Math.PI * 0.75;
				const speed = Math.sqrt(Math.pow(this.ball.velocity.x, 2) + Math.pow(this.ball.velocity.y, 2)) * 1.1;
				this.ball.position.x = -this.ball.position.x + WIDTH * 2 - 16;
				this.ball.velocity.x = -Math.cos(angle) * speed;
				this.ball.velocity.y = Math.sin(angle) * speed;
			}
		}

		if (this.ball.position.y < 0) {
			this.ball.position.y = -this.ball.position.y;
			this.ball.velocity.y = -this.ball.velocity.y;
		}

		if (this.ball.position.y > HEIGHT) {
			this.ball.position.y = -this.ball.position.y + HEIGHT * 2;
			this.ball.velocity.y = -this.ball.velocity.y;
		}
		*/

		super.lateTick();
	}
}

export class Classic {
	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;
	private game: Game;
	private lastTime?: number;

	public constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.context = canvas.getContext("2d")!;
		this.game = new Game();
	}

	public update(time: number) {
		this.lastTime ||= time;

		while (time - this.lastTime > 1000 / UPS) {
			this.game.tick();
			this.lastTime += 1000 / UPS;
		}

		if (this.canvas.width != this.canvas.clientWidth) {
			this.canvas.width = this.canvas.clientWidth;
		}

		if (this.canvas.height != this.canvas.clientHeight) {
			this.canvas.height = this.canvas.clientHeight;
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

		this.context.fillStyle = "red";
		this.context.font = "16px Arial";
		this.context.fillText(`ping: ${Math.floor(this.game.latencyNetwork.averageOverSamples())}ms`, 0, 16);
		this.context.fillText(`down: ${Math.floor(this.game.bandwidthDownload.averageOverTime())}Bps`, 0, 32);
		this.context.fillText(`up: ${Math.floor(this.game.bandwidthUpload.averageOverTime())}Bps`, 0, 48);
		this.context.fillText(`tick: ${Math.floor(this.game.tickCounter.averageOverTime())}ps`, 0, 64);
	}

	public async start(options: Options) {
		this.canvas.addEventListener("mousemove", ev => {
			const xScale = Math.floor(this.canvas.width / WIDTH);
			const yScale = Math.floor(this.canvas.height / HEIGHT);
			const minScale = Math.min(xScale, yScale);
			const xOffset = Math.floor((this.canvas.width - WIDTH * minScale) / 2);
			const yOffset = Math.floor((this.canvas.height - HEIGHT * minScale) / 2);

			const x = Math.floor((ev.offsetX - xOffset) / minScale);
			const y = Math.floor((ev.offsetY - yOffset) / minScale);

			this.game.send("move", {
				u: options.user.id,
				y,
			});
		});

		await this.game.start(options);
	}
}
