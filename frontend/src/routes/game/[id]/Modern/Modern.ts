import { Net } from "../Net";
import type { Event as NetEvent } from "../Net";
import {intersection, Vector, paddleBounce} from "../lib2D/Math2D";
import type { VectorObject, Line } from "../lib2D/Math2D";
import { Paddle } from "./Paddle";
import { WIDTH, HEIGHT, UPS, border, paddleHeight, linethickness, paddleWidth, FIELDWIDTH, FIELDHEIGHT } from "./Constants";
import type { GAME, field} from "./Constants";
import { Ball } from "./Ball";
import type { Snapshot, Options } from "../lib2D/interfaces";
import { Field } from "./Field";
import { Goal } from "./Goal";
import { Background } from "./Background";
import { levels } from "./Constants";
import { Score } from "./Score";

//This is not from interfaces because my MouseEvent needs a vectorObject
export interface MouseEvent extends NetEvent {
	userID: number;
	mouse: VectorObject;
}

function moveCollision(paddleLines: Line[], paddleVelo: Vector, ball: Ball) {

	const ballLine: Line = {p0: ball.position, p1: ball.position.add(paddleVelo), name: "ballLine"};
	let closest: [Line, Vector, number] | null = null;
	let other = [];
	for (let line of paddleLines) {
		const [t0, t1] = intersection([ballLine.p0, paddleVelo], [line.p0, line.p1.sub(line.p0)]);
		other.push([t0, t1] );
		if (t1 >= 0 && t1 <= 1 && t0 > -0.001)
		{
			if (closest === null || t0 < closest[2]) {
				const pos = ball.position.add(paddleVelo.scale(t0));
				closest = [line, pos, t0];
			}
		}


	}
	if (closest !== null) {
		return {closest: closest, other: other}
	}
	return {closest: null, other: other};
}



//TODO render score and big win screen or something
//TODO make it so only when all players press enter for example that they are able to move and the ball starts
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
	public level: field;
	public score: Score;

	//TODO now only works with rot of 0 for paddle
	private debugBall() {
		const b = this.ball.position;
		this.paddles.forEach((paddle) => {
		const p = paddle.position;
		if (paddle.angle !== 0)
			return;
		if (b.x > (p.x - 2) &&  b.x < (p.x + 2) &&
			b.y > (p.y - 6) && b.y < (p.y + 6)) {
				//ball in paddle
				console.log(paddle.owner);
				console.log("ballv", this.ball.velocity);
				debugger;
				// (this.ball, paddle);
		}
	});
	}

	public constructor(players: GAME, offscreenCanvas: HTMLCanvasElement, canvas: HTMLCanvasElement, level: field) {
		super();
		this.level = level;
		this.players = players;
		this.ball = new Ball();
		this.paddles = [];
		this.offscreenCanvas = offscreenCanvas;
		this.canvas = canvas;
		this.offscreenContext = offscreenCanvas.getContext("2d")!;
		this.goals = [];
		this.score = new Score();
		

		this.level.paddles.forEach((paddle, index) => {
			this.paddles.push(new Paddle(new Vector(paddle.x, paddle.y), paddle.angle, paddle.cf, paddle.cs, index));
		});
		this.field = new Field(this.level);
		
		this.level.goals.forEach((goal, index) => {
			this.goals.push(new Goal(new Vector(goal.x, goal.y), goal.angle, index, goal.cf, goal.cs));
		});
		this.background = new Background(this.field, this.goals);
		this.resizeOffscreenCanvas();

		this.on("mousemove", netEvent => {
			this.debugBall();
			const event = netEvent as MouseEvent;
			let paddle = this.getPaddle(event.userID) ?? this.getPaddle();
			
			
			if (paddle !== null) {
				const oldPos = new Vector(paddle.position.x, paddle.position.y);
				const oldLines = paddle.getCollisionLines();
				paddle.userID = event.userID;
				paddle.position.y = event.mouse.y;
				paddle.position.x = event.mouse.x;
				//TODO fix this for different fields
				if (paddle.position.y > FIELDHEIGHT - paddleHeight / 2 - border)
					paddle.position.y = FIELDHEIGHT - paddleHeight / 2 - border;
				if (paddle.position.y < paddleHeight / 2 + border + linethickness)
					paddle.position.y = paddleHeight / 2 + border + linethickness;
				if (paddle.position.x < paddleWidth / 2 + border + linethickness)
					paddle.position.x = paddleWidth / 2 + border + linethickness;
				if (paddle.position.x > FIELDWIDTH - paddleWidth / 2 - border - linethickness)
					paddle.position.x = FIELDWIDTH - paddleWidth / 2 - border - linethickness;
				
				const paddleMovement = new Vector((paddle.position.x - oldPos.x), (paddle.position.y - oldPos.y));
				const negvelocity = paddleMovement.scale(-1);
				
				const closest = moveCollision(oldLines, negvelocity, this.ball).closest;
				let otherclosest = [];
				let ballpos = [];
				if (closest && closest[2] < 1) {
					this.bounceBall(closest, paddleMovement);
					ballpos.push(this.ball.position);
					let i = 0;
					while (true) {
						i+=1;
						const col = moveCollision(paddle.getCollisionLines(), this.ball.velocity, this.ball).closest;
						otherclosest.push(col);
						if (col && col[2] < 1) {
							this.bounceBall(col, paddleMovement);
							ballpos.push(this.ball.position);
							// this.debugBall();
						}
						else break;
					}
					console.log(i);
				}
				if (closest)
					console.log(closest, otherclosest, ballpos);
			}
			console.log("debug");
			this.debugBall();
			
		});

		this.on("resize", (resize) => {
			this.resizeOffscreenCanvas();
		})
	}

	private bounceBall(closest: [Line, Vector, number], vel: Vector) {	
		//TODO fix that one paddle collision can have the ball position be set in another paddle
		//TODO have a check for where the ball will be placed somewhere not allowed (inside paddle, outside wall etc)
		this.ball.position = closest[1];
		this.ball.velocity = this.ball.velocity.reflect(closest[0].p1.sub(closest[0].p0));

		const magnitude = this.ball.velocity.magnitude() + 0.1;
		this.ball.velocity = this.ball.velocity.normalize();
		this.ball.velocity = paddleBounce(closest[0], this.ball);
		this.ball.velocity = this.ball.velocity.normalize().scale(magnitude);
		this.ball.velocity = this.ball.velocity.add(vel.scale(1 / UPS));
		this.ball.position = this.ball.position.add(vel.scale(1.001));
	}

	private resizeOffscreenCanvas() {
		if (this.offscreenCanvas.width != this.canvas.clientWidth)
			this.offscreenCanvas.width = this.canvas.clientWidth;
		if (this.offscreenCanvas.height != this.canvas.clientHeight)
			this.offscreenCanvas.height = this.canvas.clientHeight;
		const xScale = Math.floor(this.offscreenCanvas.width / WIDTH);
		const yScale = Math.floor(this.offscreenCanvas.height / HEIGHT);
		const minScale = Math.min(xScale, yScale);
		const xOffset = Math.floor((this.offscreenCanvas.width - FIELDWIDTH * minScale) / 2);
		const yOffset = Math.floor((this.offscreenCanvas.height - FIELDHEIGHT * minScale) / 2);
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

	//TODO lerp/slerp the paddle for smoother motion
	public render(context: CanvasRenderingContext2D) {
		this.ball.render(context);
		this.paddles.forEach(paddle => paddle.render(context));
		this.paddles.forEach(paddle => paddle.renderCollisionLines(context)); //DEBUG for collisions
		this.score.render(context);
	}

	//this function is seperate for scaling issues....
	public renderBackGround(context: CanvasRenderingContext2D) {
		context.drawImage(this.offscreenCanvas, 0, 0);
	}

	//TODO send to the backend for score update
	public lateTick() {
		this.debugBall();
		let time = 1;
		const maxSpeed = 30;
		while (time > 0) {
			let collisionLines = [];
			collisionLines.push(...this.level.collisions);
			this.paddles.forEach((paddle) => {
				collisionLines.push(...paddle.getCollisionLines());
			});
			const collision = this.ball.collision(collisionLines);
			if (collision === null || collision[2] > time + 0.001) {
				this.ball.position = this.ball.position.add(this.ball.velocity.scale(time));
				break;
			} else if (collision[0].name.startsWith("goal1")) { //TODO make it work with more goals
				/* TODO: Point to correct side according to map */
				this.ball.position = new Vector(FIELDWIDTH / 2, FIELDHEIGHT / 2);
				this.ball.velocity = new Vector(2, 0);
				break;
			} else if (collision[0].name.startsWith("goal2")) {
				/* TODO: Point to correct side according to map */
				this.ball.position = new Vector(FIELDWIDTH / 2, FIELDHEIGHT / 2);
				this.ball.velocity = new Vector(-2, 0);
				break;
			} else {
				if (collision[0].name.startsWith("paddle")) {
					const paddleIndex: number = +collision[0].name.charAt(7);
					this.bounceBall(collision,  new Vector(0, 0));
				}
				else {
					this.ball.position = collision[1];
					this.ball.velocity = this.ball.velocity.reflect(collision[0].p1.sub(collision[0].p0));
				}
				time -= collision[2];
			}
			
			if (this.ball.velocity.magnitude() > maxSpeed)
				this.ball.velocity = this.ball.velocity.scale(maxSpeed / this.ball.velocity.magnitude());
		}
		if (this.ball.velocity.magnitude() > maxSpeed)
				this.ball.velocity = this.ball.velocity.scale(maxSpeed / this.ball.velocity.magnitude());
		this.debugBall();
		super.lateTick();
	}
}

export class Modern {
	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;
	private game: Game | null;
	private lastTime?: number;
	private players: GAME;
	private offscreenCanvas: HTMLCanvasElement;
	private field: field | null;

	public async init() {
		const rest = await fetch(levels[this.players]).then(res => res.json()).then(data => {
			this.field = data;
			this.game = new Game(this.players, this.offscreenCanvas, this.canvas, this.field!);
		});
	}

	public constructor(canvas: HTMLCanvasElement, players: number) {
		this.canvas = canvas;
		this.context = canvas.getContext("2d")!;
		this.players = players;
		this.offscreenCanvas = document.createElement("canvas");
		this.offscreenCanvas.width = this.canvas.width;
		this.offscreenCanvas.height = this.canvas.height;
		this.field = null;
		this.game = null;

	}

	public update(time: number) {
		this.lastTime ||= time;

		while (time - this.lastTime > 1000 / UPS) {
			this.game?.tick();
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
		const xOffset = Math.floor((this.canvas.width - FIELDWIDTH * minScale) / 2);
		const yOffset = Math.floor((this.canvas.height - FIELDHEIGHT * minScale) / 2);
		
		this.context.fillStyle = "black";
		const posX = Math.floor(xOffset - border * minScale * 8) > 0 ? Math.floor(xOffset - border * minScale * 8) : 0;
		const posY = Math.floor(yOffset - border * minScale * 8) > 0 ? Math.floor(yOffset - border * minScale * 8) : 0;
		const width = this.canvas.width - 2 * posX;
		const height = this.canvas.height - 2 * posY;
		this.context.lineWidth = 5;
		this.context.fillRect(posX,posY,width, height); //this is for the black background
		this.game?.renderBackGround(this.context);
		this.context.save();
		this.context.translate(xOffset, yOffset);
		this.context.scale(minScale, minScale);
		this.game?.render(this.context);
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

			this.game?.send("mousemove", {
				userID: options.user.id,
				mouse: { x, y },
			});
		});
		//this event is for resizing the offscreen canvas
		window.addEventListener("resize", (ev) => {
			console.log("resize event?", ev); 
			this.game?.send("resize", {
				
			});
		});

		await this.game?.start(options);
	}
}
