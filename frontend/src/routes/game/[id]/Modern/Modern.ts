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
import { Goal } from "./Goal";
import { fields, GAME } from "./Constants";
import { Background } from "./Background";
import type { Line } from "../Classic/Classic";

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

//TODO render score and big win screen or something
export class Game extends Net {
	public ball: Ball;
	public paddles: Array<Paddle>;
	public field: Field;
	public goals: Goal[];
	public players: GAME;
	public background: Background;
	public offscreenContext: CanvasRenderingContext2D;
	public offscreenCanvas: HTMLCanvasElement;
	public canvas: HTMLCanvasElement;

	public constructor(players: GAME, offscreenCanvas: HTMLCanvasElement, canvas: HTMLCanvasElement) {
		super();

		this.players = players;
		this.ball = new Ball();
		this.paddles = [];
		this.offscreenCanvas = offscreenCanvas;
		this.canvas = canvas;
		this.offscreenContext = offscreenCanvas.getContext("2d")!;
		fields[this.players].paddles.forEach((paddle, index) => {
			this.paddles.push(new Paddle(new Vector(paddle.x, paddle.y), paddle.angle, paddle.cf, paddle.cs, index));
		});
		this.field = new Field(fields[this.players]);
		this.goals = [];
		fields[this.players].goals.forEach((goal, index) => {
			this.goals.push(new Goal(new Vector(goal.x, goal.y), goal.angle, index, goal.cf, goal.cs));
		});
		this.background = new Background(this.field, this.goals);
		this.resizeOffscreenCanvas();

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
			//TODO fix this for more than 2 players and different fields
			//TODO also fix this for rotated paddles etc (part of the diff fields)
			if (this.paddles[0].position.x > WIDTH / 2 - paddleWidth / 2 - linethickness)
				this.paddles[0].position.x = WIDTH / 2 - paddleWidth / 2 - linethickness;
			if (this.paddles[1].position.x < WIDTH / 2 + paddleWidth / 2 + linethickness)
				this.paddles[1].position.x = WIDTH / 2 + paddleWidth / 2 + linethickness;
		});

		this.on("resize", (resize) => {
			this.resizeOffscreenCanvas();
		})
	}

	private resizeOffscreenCanvas() {
		if (this.offscreenCanvas.width != this.canvas.clientWidth)
			this.offscreenCanvas.width = this.canvas.clientWidth;
		if (this.offscreenCanvas.height != this.canvas.clientHeight)
			this.offscreenCanvas.height = this.canvas.clientHeight;
		const xScale = Math.floor(this.offscreenCanvas.width / WIDTH);
		const yScale = Math.floor(this.offscreenCanvas.height / HEIGHT);
		const minScale = Math.min(xScale, yScale);
		const xOffset = Math.floor((this.offscreenCanvas.width - WIDTH * minScale) / 2);
		const yOffset = Math.floor((this.offscreenCanvas.height - HEIGHT * minScale) / 2);
		this.offscreenContext.save();
		this.offscreenContext.translate(xOffset, yOffset);
		this.offscreenContext.scale(minScale, minScale);
		this.background.render(this.offscreenContext);
		this.offscreenContext.restore();
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
		this.ball.render(context);
		this.paddles.forEach(paddle => paddle.render(context));
		this.paddles.forEach(paddle => paddle.renderCollisionLines(context)); //DEBUG for collisions
	}

	//this function is seperate for scaling issues....
	public renderBackGround(context: CanvasRenderingContext2D) {
		context.drawImage(this.offscreenCanvas, 0, 0);
	}

	//TODO send to the backend for score update
	public lateTick() {
		
		let time = 1;

		//TODO fix collision for when ball gets inside paddle
		while (time > 0) {
			let collisionLines = [];
			collisionLines.push(...fields[this.players].collisions);
			this.paddles.forEach((paddle) => {
				collisionLines.push(...paddle.getCollisionLines());
			});
			const collision = this.ball.collision(collisionLines);
			if (collision === null || collision[2] > time + 0.001) {
				this.ball.position = this.ball.position.add(this.ball.velocity.scale(time));
				break;
			} else if (collision[0].name == "goal1-1"  || collision[0].name === "goal1-2" || collision[0].name === "goal1-3") {
				/* TODO: Point to team right */
				this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);
				this.ball.velocity = new Vector(2, 0);
				break;
			} else if (collision[0].name == "goal2-1"  || collision[0].name === "goal2-2" || collision[0].name === "goal2-3") {
				/* TODO: Point to team left */
				this.ball.position = new Vector(WIDTH / 2, HEIGHT / 2);
				this.ball.velocity = new Vector(-2, 0);
				break;
			} else if (collision[0].name.substring(0, 8) == "paddle-0") {
				this.ball.position = collision[1];
				this.ball.velocity = this.ball.velocity.reflect(collision[0].p1.sub(collision[0].p0));
				const relAngle = Math.PI / 2 - Math.abs(Math.tan(this.ball.velocity.y / this.ball.velocity.x));
				const hit = (this.ball.position.y - this.paddles[0].position.y) / this.paddles[0].height; //this
				const angle = Math.atan2(this.ball.velocity.y, this.ball.velocity.x) + relAngle * hit;
				this.ball.velocity = new Vector(Math.cos(angle), Math.sin(angle)).scale(this.ball.velocity.magnitude() + 0.1);
				break;
			} else if (collision[0].name.substring(0, 8) == "paddle-1") {
				this.ball.position = collision[1];
				this.ball.velocity = this.ball.velocity.reflect(collision[0].p1.sub(collision[0].p0));
				const relAngle = Math.PI / 2 - Math.abs(Math.tan(this.ball.velocity.y / this.ball.velocity.x));
				const hit = (this.ball.position.y - this.paddles[1].position.y) / this.paddles[1].height; //this
				const angle = Math.atan2(this.ball.velocity.y, this.ball.velocity.x) - relAngle * hit;
				this.ball.velocity = new Vector(Math.cos(angle), Math.sin(angle)).scale(this.ball.velocity.magnitude() + 0.1);
				break;
			} else {
				this.ball.position = collision[1];
				this.ball.velocity = this.ball.velocity.reflect(collision[0].p1.sub(collision[0].p0));
				time -= collision[2];
			}
		}

		super.lateTick();
	}
}

export class Modern {
	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;
	private game: Game;
	private lastTime?: number;
	private players: GAME;
	private offscreenCanvas: HTMLCanvasElement;

	public constructor(canvas: HTMLCanvasElement, players: number) {
		this.canvas = canvas;
		this.context = canvas.getContext("2d")!;
		this.players = players;
		this.offscreenCanvas = document.createElement("canvas");
		this.offscreenCanvas.width = this.canvas.width;
		this.offscreenCanvas.height = this.canvas.height;
		
		this.game = new Game(players, this.offscreenCanvas, this.canvas);

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
		const posX = Math.floor(xOffset - border * minScale * 8) > 0 ? Math.floor(xOffset - border * minScale * 8) : 0;
		const posY = Math.floor(yOffset - border * minScale * 8) > 0 ? Math.floor(yOffset - border * minScale * 8) : 0;
		const width = this.canvas.width - 2 * posX;
		const height = this.canvas.height - 2 * posY;
		this.context.lineWidth = 5;
		this.context.fillRect(posX,posY,width, height); //this is for the black background
		this.game.renderBackGround(this.context);
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
		//this event is for resizing the offscreen canvas
		window.addEventListener("resize", (ev) => {
			console.log("resize event?", ev); 
			this.game.send("resize", {
				
			});
		});

		await this.game.start(options);
	}
}
