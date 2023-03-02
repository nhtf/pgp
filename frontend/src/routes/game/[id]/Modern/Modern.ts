import { Net } from "../Net";
import type { Event as NetEvent } from "../Net";
import {intersection, Vector, paddleBounce, isInConvexHull} from "../lib2D/Math2D";
import type { VectorObject, Line, CollisionLine } from "../lib2D/Math2D";
import { Paddle } from "./Paddle";
import { WIDTH, HEIGHT, UPS, border, FIELDWIDTH, FIELDHEIGHT, levels, PADDLE_PING_INTERVAL, PADDLE_PING_TIMEOUT, ballVelociy } from "./Constants";
import { GAME, type field} from "./Constants";
import { Ball } from "./Ball";
import type { Snapshot, Options, PingEvent } from "../lib2D/interfaces";
import { Field } from "./Field";
import { Goal } from "./Goal";
import { Background } from "./Background";
import { Score } from "./Score";
import { Team } from "../lib2D/Team";

const hit = new Audio("/Assets/sounds/laser.wav");
const scoreSound = new Audio("/Assets/sounds/teleportation.mp3");
const wall = new Audio("/Assets/sounds/wall.wav");
const music = new Audio("/Assets/sounds/zetauri.wav");
const scale = 1;

//This is not from interfaces because my MouseEvent needs a vectorObject
export interface MouseEvent extends NetEvent {
	u: number; //userid
	x: number; //xpos
	y: number; //ypos
	t: number; //teamId
	r: number; //rotation
}

export interface ScoreEvent extends NetEvent {
	u: number; //userId that is sending the event
	t: number; //teamId of team that is being updated
	s: number; //scorechange
}

function moveCollision(paddleLines: CollisionLine[], paddleVelo: Vector, ball: Ball) {

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
				let newLine: Line = {p0: line.p0, p1: line.p1, name: line.name};
				closest = [newLine, pos, t0];
			}
		}
	}
	if (closest !== null) {
		return {closest: closest, other: other}
	}
	return {closest: null, other: other};
}

import { activateRipple } from "./Shader/RippleShader";

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
	public score?: Score;
	public teams: Array<Team>;
	private id?: number;
	

	private debugBall() {
		const b = this.ball.position;
		for (let paddle of this.paddles) {
			if (isInConvexHull(this.ball.position, paddle.getCollisionLines(), false)) {
				console.log("in paddle");
				debugger;
			}
		}
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
		this.teams = [];
		this.paddles = [];
		this.field = new Field(this.level);
		
		this.level.goals.forEach((goal, index) => {
			this.goals.push(new Goal(new Vector(goal.x, goal.y), goal.angle, index, goal.cf, goal.cs));
		});
		this.background = new Background(this.field, this.goals);
		this.resizeOffscreenCanvas();

		this.on("mousemove", netEvent => {
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

				const oldPos = new Vector(paddle.position.x, paddle.position.y);
				const oldLines = paddle.getCollisionLines();
				//TODO maybe limit the max amount of movement allowed for the paddle
				if (paddle.isInPlayerArea(new Vector(paddle.position.x + event.x, paddle.position.y), this.field.getPlayerAreas()[paddle.owner]))
					paddle.position.x += event.x;
				if (paddle.isInPlayerArea(new Vector(paddle.position.x, paddle.position.y + event.y), this.field.getPlayerAreas()[paddle.owner]))
					paddle.position.y += event.y;
				
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
						}
						else break;
					}
				}
			}
		});

		this.on("mousescroll", netEvent => {
			console.log("scroll event");
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

				paddle.rotation += event.r;
			}
		});

		this.on("resize", (resize) => {
			this.resizeOffscreenCanvas();
		});

		this.on("ping", netEvent => {
			const event = netEvent as PingEvent;
			const paddle = this.getPaddle(event.u);

			if (paddle !== null) {
				paddle.ping = this.time;
			}

			const team = this.getTeam(event.u);

			if (team !== null) {
				team.ping = this.time;
			}
		});

		//TODO this causes a lot of issues, need to improve this because of the snapshot thing
		//TODO also need to send message to the update socket
		this.on("score", netEvent => {
			const event = netEvent as ScoreEvent;

			let team = this.getTeam(event.u);
			if (team === null) {
				
				team = this.teams.find(t => t.id == event.t) ?? null;
				if (team?.userId !== undefined) {
					team = null;
				}
			}
			if (team !== null) {
				team.userId = event.u;
				team.ping = this.time;
				team.score = event.s;
			}
		});
	}

	private bounceBall(closest: [Line, Vector, number], vel: Vector) {	
		hit.play();
		this.ball.position = closest[1];
		this.ball.velocity = this.ball.velocity.reflect(closest[0].p1.sub(closest[0].p0));

		const magnitude = this.ball.velocity.magnitude() + 0.1;
		this.ball.velocity = this.ball.velocity.normalize();
		this.ball.velocity = paddleBounce(closest[0], this.ball);
		this.ball.velocity = this.ball.velocity.normalize().scale(magnitude);
		this.ball.velocity = this.ball.velocity.add(vel.scale(1 / UPS));
		this.ball.position = this.ball.position.add(vel.scale(1.001));
		if (!isInConvexHull(this.ball.position, this.field.getConvexFieldBoxLines(), true)) {
			console.log("ERROR: ball outside field. Resetting position.");
			this.ball.position = new Vector(WIDTH / 2, HEIGHT /2);
			this.ball.velocity = this.ball.velocity.tangent();
		}
		for (let paddle of this.paddles) {
			if (isInConvexHull(this.ball.position, paddle.getCollisionLines(), false)) {
				if (isInConvexHull(closest[1], paddle.getCollisionLines(), false))
				{
					console.log("ERROR: ball in paddle. Resetting Position.");
					// this.ball.position = new Vector(WIDTH / 2, HEIGHT /2);
					// this.ball.velocity = this.ball.velocity.tangent();
				}
			}
		}
	}

	private resizeOffscreenCanvas() {
		if (this.offscreenCanvas.width != this.canvas.width)
			this.offscreenCanvas.width = this.canvas.width;
		if (this.offscreenCanvas.height != this.canvas.height)
			this.offscreenCanvas.height = this.canvas.height;
		const xScale = (this.offscreenCanvas.width / Math.floor(WIDTH * scale));
		const yScale = (this.offscreenCanvas.height / Math.floor(HEIGHT * scale));
		const minScale = Math.floor(Math.min(xScale, yScale));
		const xOffset = Math.floor((this.offscreenCanvas.width - FIELDWIDTH * minScale) / 2);
		const yOffset = Math.floor((this.offscreenCanvas.height - FIELDHEIGHT * minScale) / 2);
		this.offscreenContext.save();
		this.offscreenContext.translate(xOffset, yOffset);
		this.offscreenContext.scale(minScale, minScale);
		this.background.render(this.offscreenContext);
		this.offscreenContext.restore();
		console.log("resizing offscreencanvas");
	}

	protected save(): Snapshot {
		return {
			ball: this.ball.save(),
			paddles: this.paddles.map(paddle => paddle.save()),
			teams: this.teams.map(team => team.save()),
			...super.save(),
		};
	}

	protected load(snapshot: Snapshot) {
		this.ball.load(snapshot.ball);
		this.paddles.forEach((paddle, i) => paddle.load(snapshot.paddles[i]));
		this.teams.forEach((team, i) => team.load(snapshot.teams[i]));
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

	public getTeam(userID?: number): Team | null {
		for (let team of this.teams) {
			if (team.userId === userID) {
				return team;
			}
		}

		return null;
	}

	//TODO lerp/slerp the paddle (and ball?) for smoother motion
	public render(context: CanvasRenderingContext2D) {
		this.ball.render(context);
		this.paddles.forEach(paddle => paddle.render(context));
		// this.paddles.forEach(paddle => paddle.renderCollisionLines(context)); //DEBUG for collisions
		this.score?.render(context);
		// this.field.renderCollisionLines(context); //debug function
		// this.field.renderPlayerAreas(context); //debug function
		// this.field.renderConvexFieldBoxLines(context); //debug function
	}

	//this function is seperate for scaling issues....
	public renderBackGround(context: CanvasRenderingContext2D) {
		context.drawImage(this.offscreenCanvas, 0, 0);
	}

	//TODO send to the backend for score update
	public lateTick() {
		let time = 1;
		const maxSpeed = 30;
		while (time > 0) {
			let collisionLines: CollisionLine[] = [];
			collisionLines.push(...this.level.collisions);
			this.paddles.forEach((paddle) => {
				collisionLines.push(...paddle.getCollisionLines());
			});
			const collision = this.ball.collision(collisionLines);
			if (collision === null || collision[2] > time + 0.001) {
				this.ball.position = this.ball.position.add(this.ball.velocity.scale(time));
				break;
			} else if (collision[0].name.startsWith("goal")) {
				//TODO because of the snapshot system it will do this multiple times including sound effects etc
				//TODO also send update to backend for score
				//TODO better score update
				scoreSound.play();
				let goal: number = +collision[0].name.charAt(4);
				let score;
				if (this.level.players > 2)
					score = this.teams[goal].score - 1;
				else if (goal === 1) {
					goal = 0;
					score = this.teams[goal].score + 1;
				}
				else {
					goal = 1;
					score = this.teams[goal].score + 1;
				}
				// this.teams[goal].id
				//TODO It will send this for everyone, even if they are playing back old events....
				this.send("score", {
					u: this.id,
					s: score,
					t: this.teams[goal].id,
				});
				activateRipple();
				this.ball.position = new Vector(FIELDWIDTH / 2, FIELDHEIGHT / 2);
				this.ball.velocity = new Vector(ballVelociy[this.players][goal].x, ballVelociy[this.players][goal].y);
				
				break;
			} else {
				if (collision[0].name.startsWith("paddle")) {
					this.bounceBall(collision,  new Vector(0, 0));
				}
				else {
					wall.play();
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

		for (let paddle of this.paddles) {
			if (paddle.ping + PADDLE_PING_TIMEOUT < this.time) {
				paddle.userID = undefined;
			}
		}

		for (let team of this.teams) {
			if (team.ping + PADDLE_PING_TIMEOUT < this.time) {
				team.userId = undefined;
			}
		}

		if (this.ball.position.x < -2 * border || this.ball.position.x > this.field.width + 2 * border ||
			this.ball.position.y < 90 - this.field.height / 2 - border || this.ball.position.y > 90 + this.field.height / 2 + border)
		{
			console.log("pos: ", this.ball.position.x);
			console.log("ERROR: ball outside field. Resetting position.");
			this.ball.position = new Vector(WIDTH / 2, HEIGHT /2);
			this.ball.velocity = this.ball.velocity.tangent();
		}
		super.lateTick();
	}

	public async start(options: Options) {
		this.id = options.member.user.id;
		this.teams = [];
		for (let i = 0; i < this.level.players; i++) {
			this.teams.push(new Team((options.member as any).room.teams[i].id));
		}

		let index = 0;
		for (let paddle of this.level.paddles) {
			this.paddles.push(new Paddle(new Vector(paddle.x, paddle.y), paddle.angle, paddle.cf, paddle.cs, index, this.teams[index]))
			index +=1;
		}
		this.score = new Score(this.teams);
		super.start(options);
		music.loop = true;
		music.muted = false;
		music.volume = 0.5;
		music.play();
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
	private interval?: NodeJS.Timer;
	private id?: number;
	private options?: Options;

	public async init() {
		const rest = await fetch(levels[this.players]).then(res => res.json()).then(data => {
			this.field = data;
			console.log(this.field);
			this.game = new Game(this.players, this.offscreenCanvas, this.canvas, this.field!);
		});
	}

	public constructor(canvas: HTMLCanvasElement, players: number) {
		this.canvas = canvas;
		this.canvas.width = Math.floor(WIDTH * scale);
		this.canvas.height = Math.floor(HEIGHT * scale);
		this.context = canvas.getContext("2d")!;
		this.players = players;
		this.offscreenCanvas = document.createElement("canvas");
		this.offscreenCanvas.width = Math.floor(WIDTH * scale);
		this.offscreenCanvas.height = Math.floor(HEIGHT * scale);
		this.field = null;
		this.game = null;
	}

	public update(time: number) {
		this.lastTime ||= time;

		while (time - this.lastTime > 1000 / UPS) {
			this.game?.tick();
			this.lastTime += 1000 / UPS;
		}
		this.context.fillStyle = "black";
		const xScale = (this.canvas.width / Math.floor(WIDTH * scale));
		const yScale = (this.canvas.height / Math.floor(HEIGHT * scale));
		const minScale = Math.floor(Math.min(xScale, yScale));
		const xOffset = Math.floor((this.canvas.width - FIELDWIDTH * minScale) / 2);
		const yOffset = Math.floor((this.canvas.height - FIELDHEIGHT * minScale) / 2);
		const posX = Math.floor(xOffset - border * minScale * 8) > 0 ? Math.floor(xOffset - border * minScale * 8) : 0;
		const posY = Math.floor(yOffset - border * minScale * 8) > 0 ? Math.floor(yOffset - border * minScale * 8) : 0;
		const width = this.canvas.width - 2 * posX;
		const height = this.canvas.height - 2 * posY;
		console.log(width, height, this.canvas.width, this.canvas.height, posX, posY, xOffset, yOffset, minScale);
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
		this.options = options;

		//debug for why rendering is weird
		//TODO find out why rendering is blurry and there is a black rectange
		this.context.fillStyle = "red";
		this.context.fillRect(0,0, 50, 50);
		// this.canvas.addEventListener("mousemove", ev => {
		// 	const xScale = Math.floor(this.canvas.width / WIDTH);
		// 	const yScale = Math.floor(this.canvas.height / HEIGHT);
		// 	const minScale = Math.min(xScale, yScale);
			
		// 	this.game?.send("mousemove", {
		// 		u: options.member.user.id,
		// 		x: ev.movementX/ minScale,
		// 		y: ev.movementY/ minScale,
		// 		t: options.member.player?.team?.id,
		// 	});
		// });

		//TODO maybe have middleclick or something for resetting rotation?
		// if (this.players === GAME.FOURPLAYERS) {
		// 	this.canvas.addEventListener("wheel", ev => {
		// 		const rotation = ev.deltaY / 16 * 2 * 0.01745329;
		// 		this.game?.send("mousescroll", {
		// 			u: options.member.user.id,
		// 			x: 0,
		// 			y: 0,
		// 			t: options.member.player?.team?.id,
		// 			r: rotation
		// 		});
		// 	});
		// }
		
		//this event is for resizing the offscreen canvas
		// window.addEventListener("resize", (ev) => {
		// 	this.game?.send("resize", {
		// 	});
		// });
		this.interval = setInterval(() => {
			this.game?.send("ping", {
				u: options.member.user.id,
			});
		}, 1000 / PADDLE_PING_INTERVAL);

		await this.game?.start(options);
	}

	public mousemove(moveX: number, moveY: number) {
		if (!this.options) {
			return;
		}
		const xScale = Math.floor(this.canvas.width / WIDTH);
		const yScale = Math.floor(this.canvas.height / HEIGHT);
		const minScale = Math.min(xScale, yScale);
		const x = Math.floor((moveX) / minScale);
		const y = Math.floor((moveY) / minScale);
			
			if (this.options.member.player != null) {
			this.game?.send("mousemove", {
				u: this.options.member.user.id,
				x: x,
				y: y,
				t: this.options.member.player?.team?.id,
			});
		}
	}

	public mouseWheel(deltaY: number) {
		if (!this.options) {
			return;
		}
		const rotation = deltaY / 16 * 2 * 0.01745329;
			
			if (this.options.member.player != null && this.players === GAME.FOURPLAYERS) {
				this.game?.send("mousescroll", {
					u: this.options.member.user.id,
					x: 0,
					y: 0,
					t: this.options.member.player?.team?.id,
					r: rotation
				});
		}
	}

	public resize() {
		this.game?.send("resize", {});
	}

	public stop() {
		this.game!.stop();
		clearInterval(this.interval);
		music.loop = false;
		music.muted = true;
	}
}
