import { Net } from "./Net";
import type { Snapshot as NetSnapshot, Event as NetEvent, Options } from "./Net";

export const WIDTH = 160;
export const HEIGHT = 90;
export const UPS = 60;

export interface VectorObject {
	x: number;
	y: number;
}

export interface BallObject {
	position: VectorObject;
	velocity: VectorObject;
}

export interface PaddleObject {
	position: VectorObject;
	height: number;
}

export interface Snapshot extends NetSnapshot {
	ball: BallObject;
	paddles: PaddleObject[];
}

export interface MouseEvent extends NetEvent {
	mouse: VectorObject;
}

export class Vector {
	public x: number;
	public y: number;

	public constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	public save(): VectorObject {
		return {
			x: this.x,
			y: this.y,
		};
	}

	public static load(object: VectorObject): Vector {
		return new Vector(object.x, object.y);
	}
}

export class Ball {
	public position: Vector;
	public velocity: Vector;

	public constructor() {
		this.position = new Vector(WIDTH / 2, HEIGHT / 2);
		this.velocity = new Vector(1, 1);
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

	public load(object: BallObject) {
		this.position = Vector.load(object.position);
		this.velocity = Vector.load(object.velocity);
	}
}

export class Paddle {
	public position: Vector;
	public height: number;

	public constructor(side: "left" | "right") {
		if (side === "left") {
			this.position = new Vector(8, HEIGHT / 2);
		} else {
			this.position = new Vector(WIDTH - 8, HEIGHT / 2);
		}

		this.height = 8;
	}

	public render(context: CanvasRenderingContext2D) {
		context.fillStyle = "white";
		context.fillRect(this.position.x - 1, this.position.y - this.height / 2, 2, this.height);
	}

	public save(): PaddleObject {
		return {
			position: this.position.save(),
			height: this.height,
		};
	}

	public load(object: PaddleObject) {
		this.position = Vector.load(object.position);
		this.height = object.height;
	}
}

export class Game extends Net {
	public ball: Ball;
	public paddles: Array<Paddle>;

	public constructor() {
		super();

		this.ball = new Ball();
		this.paddles = [new Paddle("left"), new Paddle("right")];

		this.on("mousemove", netEvent => {
			const event = netEvent as MouseEvent;

			this.paddles[0].position.y = event.mouse.y;
			this.paddles[1].position.y = event.mouse.y;
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

	public render(context: CanvasRenderingContext2D) {
		context.fillStyle = "black";
		context.fillRect(0, 0, WIDTH, HEIGHT);
	
		this.ball.render(context);
		this.paddles.forEach(paddle => paddle.render(context));
	}

	public lateTick() {
		this.ball.position.x += this.ball.velocity.x;
		this.ball.position.y += this.ball.velocity.y;

		if (this.ball.position.x < 8) {
			this.ball.position.x = -this.ball.position.x + 16;
			this.ball.velocity.x = -this.ball.velocity.x;
			
			if (Math.abs(this.ball.position.y - this.paddles[0].position.y) > this.paddles[0].height / 2) {
				this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);
			}
		}

		if (this.ball.position.x > WIDTH - 8) {
			this.ball.position.x = -this.ball.position.x + WIDTH * 2 - 16;
			this.ball.velocity.x = -this.ball.velocity.x;

			if (Math.abs(this.ball.position.y - this.paddles[0].position.y) > this.paddles[0].height / 2) {
				this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);
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

		canvas.addEventListener("mousemove", ev => {
			const xScale = Math.floor(this.canvas.width / WIDTH);
			const yScale = Math.floor(this.canvas.height / HEIGHT);
			const minScale = Math.min(xScale, yScale);
			const xOffset = Math.floor((this.canvas.width - WIDTH * minScale) / 2);
			const yOffset = Math.floor((this.canvas.height - HEIGHT * minScale) / 2);

			const x = (ev.offsetX - xOffset) / minScale;
			const y = (ev.offsetY - yOffset) / minScale;

			this.game.send("mousemove", {
				mouse: { x, y },
			});
		});
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
	}

	public async start(options: Options) {
		await this.game.start(options);
	}
}
