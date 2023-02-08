import { Net } from "../Net";
import type { Snapshot as NetSnapshot, Event as NetEvent, Options as NetOptions } from "../Net";
import type { User } from "$lib/types";
import {Vector} from "./Math";
import type { VectorObject } from "./Math";
import type { PaddleObject } from "./Paddle";
import { Paddle } from "./Paddle";
import { WIDTH, HEIGHT, UPS, border, paddleHeight, linethickness, paddleWidth } from "./Constants";
import { Ball } from "./Ball";
import type { BallObject } from "./Ball";
import { Field } from "./Field";

const players = 2;


export interface Snapshot extends NetSnapshot {
	ball: BallObject;
	paddles: PaddleObject[];
}

export interface MouseEvent extends NetEvent {
	userID: number;
	mouse: VectorObject;
}

export interface Options extends NetOptions {
	user: User;
}


export class Game extends Net {
	public ball: Ball;
	public paddles: Array<Paddle>;
	public field: Field;

	public constructor() {
		super();

		this.ball = new Ball();
		this.paddles = [new Paddle("left"), new Paddle("right")];
		this.field = new Field();

		this.on("mousemove", netEvent => {
			const event = netEvent as MouseEvent;
			let paddle = this.getPaddle(event.userID) ?? this.getPaddle();

			if (paddle !== null) {
				paddle.userID = event.userID;
				paddle.position.y = event.mouse.y;
				paddle.position.x = event.mouse.x;
				if (paddle.position.y > HEIGHT - paddleHeight / 2 - border)
					paddle.position.y = HEIGHT - paddleHeight / 2 - border;
				if (paddle.position.y < paddleHeight / 2 + border + linethickness)
					paddle.position.y = paddleHeight / 2 + border + linethickness;
				if (paddle.position.x < paddleWidth / 2 + border + linethickness)
					paddle.position.x = paddleWidth / 2 + border + linethickness;
				if (paddle.position.x > WIDTH - paddleWidth / 2 - border - linethickness)
					paddle.position.x = WIDTH - paddleWidth / 2 - border - linethickness;
			}
			if (this.paddles[0].position.x > WIDTH / 2 - paddleWidth / 2 - linethickness)
				this.paddles[0].position.x = WIDTH / 2 - paddleWidth / 2 - linethickness;
			if (this.paddles[1].position.x < WIDTH / 2 + paddleWidth / 2 + linethickness)
				this.paddles[1].position.x = WIDTH / 2 + paddleWidth / 2 + linethickness;
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

	//TODO lerp/slerp the paddle and ball for smoother motion
	public render(context: CanvasRenderingContext2D) {
		this.field.render(context);
		this.ball.render(context);
		this.paddles.forEach(paddle => paddle.render(context));
	}

	//TODO send to the backend for score update
	//TODO check for goal collision for points + cleanup
	//TODO better collission detection with paddle (also if for 4 players paddle will be rotated) intersect or something
	public lateTick() {
		this.ball.previousPos.x = this.ball.position.x;
		this.ball.previousPos.y = this.ball.position.y;
		this.ball.position.x += this.ball.velocity.x;
		this.ball.position.y += this.ball.velocity.y;

		for (let i = 0; i < players; i+=1) {
			if ((Math.abs(this.ball.position.x - this.paddles[i].position.x) <= this.paddles[i].width) &&
				(Math.abs(this.ball.position.y - this.paddles[i].position.y) <= this.paddles[i].height / 2)) {
				const angle = (this.ball.position.y - this.paddles[0].position.y) / this.paddles[0].height * Math.PI * 0.75;
				let speed = Math.sqrt(Math.pow(this.ball.velocity.x, 2) + Math.pow(this.ball.velocity.y, 2)) * 1.1;
				if (speed > 5.75)
					speed = 5.75; //TODO check if this speed is nice as max
				this.ball.velocity.x = Math.cos(angle) * speed;
				this.ball.velocity.y = Math.sin(angle) * speed;
			}
		}
		
		//Here should be check for goal collision instead of wall
		// if (collision in goal) ->
		// this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);


		//Wall Collisions
		if (this.ball.position.x < border) {
			this.ball.position.x = -this.ball.position.x + 2 * border;
			this.ball.velocity.x = -this.ball.velocity.x;
			
		}

		if (this.ball.position.x > WIDTH - border) {
			this.ball.position.x = -this.ball.position.x + WIDTH * 2 - 2 * border;
			this.ball.velocity.x = -this.ball.velocity.x;
		}

		if (this.ball.position.y < border) {
			this.ball.position.y = -this.ball.position.y + 2 * border;
			this.ball.velocity.y = -this.ball.velocity.y;
		}

		if (this.ball.position.y > HEIGHT - border) {
			this.ball.position.y = -this.ball.position.y + HEIGHT * 2 - 2 * border;
			this.ball.velocity.y = -this.ball.velocity.y;
		}

		super.lateTick();
	}
}

export class Modern {
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
		
		this.context.fillStyle = "black";
		const posX = Math.floor(xOffset - border * minScale * 8);
		const posY = Math.floor(yOffset - border * minScale * 8);
		const width = this.canvas.width - 2 * posX;
		const height = this.canvas.height - 2 * posY;
		this.context.lineWidth = 5;
		this.context.fillRect(posX,posY,width, height); //this is for the black background
		this.context.save();
		this.context.translate(xOffset, yOffset);
		this.context.scale(minScale, minScale);
		this.game.render(this.context);
		this.context.restore();
		this.context.strokeStyle = "gray";
		this.context.lineJoin = "round";
		this.context.lineCap = "round";
		this.context.strokeRect(posX,posY,width, height); //this is to hide errors in the outside hexagons
	}

	public async start(options: Options) {
		this.canvas.addEventListener("mousemove", ev => {
			const xScale = Math.floor(this.canvas.width / WIDTH);
			const yScale = Math.floor(this.canvas.height / HEIGHT);
			const minScale = Math.min(xScale, yScale);
			const xOffset = Math.floor((this.canvas.width - WIDTH * minScale) / 2);
			const yOffset = Math.floor((this.canvas.height - HEIGHT * minScale) / 2);

			const x = (ev.offsetX - xOffset) / minScale;
			const y = (ev.offsetY - yOffset) / minScale;

			this.game.send("mousemove", {
				userID: options.user.id,
				mouse: { x, y },
			});
		});

		await this.game.start(options);
	}
}
