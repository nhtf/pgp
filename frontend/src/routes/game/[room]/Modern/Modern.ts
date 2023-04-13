import { Net } from "../Net";
import type { Event as NetEvent } from "../Net";
import { intersection, Vector, paddleBounce, isInConvexHull, serializeNumber, deserializeNumber } from "../lib2D/Math2D";
import type { Line } from "../lib2D/Math2D";
import { Paddle } from "./Paddle";
import { WIDTH, HEIGHT, UPS, border, FIELDWIDTH, FIELDHEIGHT, levels, PADDLE_PING_INTERVAL, PADDLE_PING_TIMEOUT, ballVelociy } from "./Constants";
import { GAME} from "./Constants";
import type { level } from "./Constants";
import { Ball } from "./Ball";
import type {  Options, PingEvent, TeamObject } from "../lib2D/interfaces";
import { Field } from "./Field";
import { Score } from "./Score";
import { Team } from "../lib2D/Team";
import { FullShader } from "./fullShader";
import type {Snapshot as NetSnapshot } from "../Net";
import type { BallObject } from "./Ball";
import type { PaddleObject } from "./Paddle";

const hit = new Audio("/Assets/sounds/laser.wav");
const scoreSound = new Audio("/Assets/sounds/teleportation.mp3");
const wall = new Audio("/Assets/sounds/wall.wav");
const music = new Audio("/Assets/sounds/zetauri.wav");

//This is not from interfaces because my MouseEvent needs a vectorObject
export interface MouseEvent extends NetEvent {
	u: number; //userid
	x: string; //xpos
	y: string; //ypos
	t: number; //teamId
	r: string; //rotation
	b?: number; //button clicked
}

export interface BallEvent extends NetEvent {
	vx: string;
	vy: string;
}

export interface ScoreEvent extends NetEvent {
	u: number; //userId that is sending the event
	t: number; //teamId of team that is being updated
	s: number; //scorechange
}

interface Snapshot extends NetSnapshot {
	ball: BallObject;
	paddles: PaddleObject[];
	state: {
		teams: TeamObject[];
		finished: boolean;
	};
};

//TODO still desync seems to be ping and userId in paddle that is the issue maybe?

function moveCollision(paddleLines: Line[], paddleVelo: Vector, ball: Ball) {

	const ballLine: Line = {p0: ball.position, p1: ball.position.add(paddleVelo), name: "ballLine"};
	let closest: [Line, Vector, number] | null = null;
	for (let line of paddleLines) {
		const [t0, t1] = intersection([ballLine.p0, paddleVelo], [line.p0, line.p1.sub(line.p0)]);
		if (t1 >= 0 && t1 <= 1 && t0 > -0.001) {
			if (closest === null || t0 < closest[2]) {
				const pos = ball.position.add(paddleVelo.scale(t0));
				let newLine: Line = {p0: line.p0, p1: line.p1, name: line.name};
				closest = [newLine, pos, t0];
			}
		}
	}
	return closest;
}

export class Game extends Net {
	public ball: Ball;
	public paddles: Array<Paddle>;
	public field: Field;
	public players: GAME;
	public level: level;
	public score?: Score;
	public teams: Array<Team>;
	public shader: FullShader;
	public finished?: boolean;

	public constructor(players: GAME, level: level, shader: FullShader) {
		super();
		this.level = level;
		this.players = players;
		this.ball = new Ball();
		this.paddles = [];
		this.teams = [];
		this.paddles = [];
		this.field = new Field(this.level);
		this.shader = shader;

		this.on("mousemove", netEvent => {
			const event = netEvent as MouseEvent;
			let paddle = this.getPaddle(event.u);

			if (paddle === null) {
				paddle = this.paddles.find(p => p.team.id == event.t) ?? null;
				if (paddle?.userId !== undefined) {
					paddle = null;
				}
			}
			if (paddle !== null) {
				paddle.userId = event.u;
				paddle.ping = this.time;

				const oldPos = new Vector(paddle.position.x, paddle.position.y);
				const oldLines = paddle.getCollisionLines();

				paddle.position.x += deserializeNumber(event.x);
				paddle.position.y += deserializeNumber(event.y);
				
				this.shader.movePaddle(paddle.position, paddle.owner);
				const paddleMovement = new Vector((paddle.position.x - oldPos.x), (paddle.position.y - oldPos.y));
				const negvelocity = paddleMovement.scale(-1);
				
				const closest = moveCollision(oldLines, negvelocity, this.ball);
				if (closest && closest[2] < 1) {
					this.bounceBall(closest, paddleMovement);
					const lines = paddle.getCollisionLines();
					let i = 0;
					while (i < 3) {
						i+=1;
						const col = moveCollision(lines, this.ball.velocity, this.ball);
						if (col && col[2] < 1)
							this.bounceBall(col, paddleMovement);
						else break;
					}
				}
			}
		});

		this.on("mousescroll", netEvent => {
			const event = netEvent as MouseEvent;
			let paddle = this.getPaddle(event.u);

			if (paddle === null) {
				paddle = this.paddles.find(p => p.team.id == event.t) ?? null;
				if (paddle?.userId !== undefined) {
					paddle = null;
				}
			}
			if (paddle !== null) {
				paddle.userId = event.u;
				paddle.ping = this.time;

				const oldRot = paddle.rotation;
				paddle.rotation += deserializeNumber(event.r);
				if (paddle.isBallInPaddle(this.ball.position)) {
					// console.log("ball in paddle with this rotation - NOT ALLOWED!!");
					paddle.rotation = oldRot;
				}

				if (paddle.rotation != deserializeNumber(serializeNumber(paddle.rotation))) {
					console.error("how did we get here");
				}

				this.shader.rotatePaddle(paddle.rotation, paddle.owner);
			}
		});

		this.on("mouseclick", netEvent => {
			const event = netEvent as MouseEvent;
			let paddle = this.getPaddle(event.u);

			if (paddle === null) {
				paddle = this.paddles.find(p => p.team.id == event.t) ?? null;
				if (paddle?.userId !== undefined) {
					paddle = null;
				}
			}
			if (paddle !== null) {
				paddle.userId = event.u;
				paddle.ping = this.time;
				if (event.b === 1 ) {
					paddle.rotation = this.level.paddles[paddle.owner].angle;
					this.shader.rotatePaddle(paddle.rotation, paddle.owner);
				}
				if (event.b === 0 && this.ball.velocity.magnitude() == 0) {
					let teamActive = 0;
					let gameOver = false;
					this.teams.forEach((team, i) => {
						if (team.active) {
							teamActive = i;
						}
						if (Math.abs(team.score) >= 10) {
							gameOver = true;
						}
					});
					if (gameOver) {
						// console.log("game is over - ball not allowed to launch anymore");
						return;
					}
					this.teams[teamActive].active = true;
					// console.log("player ", paddle.owner, " is trying to launch the ball, ball can be launched by player ", teamActive);
				}
				if (event.b === 0 && this.teams[paddle.owner].active) {
					// console.log("ballLaunch Event!!!");
					this.teams[paddle.owner].active = false;
					this.ball.velocity = new Vector(ballVelociy[this.players][paddle.owner].x, ballVelociy[this.players][paddle.owner].y);
					this.shader.changeBallOwner([0.871, 0.898, 0.07, 1]);
				}

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

	private bounceBall(closest: [Line, Vector, number], vel: Vector) {	
		this.pray("paddle-sound", 30, () => (hit.cloneNode(true) as HTMLAudioElement).play());
		this.ball.position = closest[1];
		this.ball.velocity = this.ball.velocity.reflect(closest[0].p1.sub(closest[0].p0));

		const magnitude = this.ball.velocity.magnitude() + 0.1;
		this.ball.velocity = this.ball.velocity.normalize();
		this.ball.velocity = paddleBounce(closest[0], this.ball);
		this.ball.velocity = this.ball.velocity.normalize().scale(magnitude);
		this.ball.velocity = this.ball.velocity.add(vel.scale(1 / UPS));
		this.ball.position = this.ball.position.add(vel.scale(1.001));
		if (!isInConvexHull(this.ball.position, this.field.getConvexFieldBoxLines(), true)) {
			// console.log("ERROR: ball outside field. Resetting position. ConvexHull Check.");
			this.ball.position = new Vector(WIDTH / 2, HEIGHT /2);
			this.ball.velocity = this.ball.velocity.tangent();
		}
		this.shader.moveBall(this.ball.position);
	}

	protected save(): Snapshot {
		return {
			ball: this.ball.save(),
			paddles: this.paddles.map(paddle => paddle.save()),
			state: {teams: this.teams.map(team => team.save()),
					finished: this.finished!},
			...super.save(),
		};
	}

	protected load(snapshot: Snapshot) {
		this.ball.load(snapshot.ball);
		this.paddles.forEach((paddle, i) => { 
			paddle.load(snapshot.paddles[i]);
			this.shader.movePaddle(paddle.position, paddle.owner);
			this.shader.rotatePaddle(paddle.rotation, paddle.owner);
		});
		this.teams.forEach((team, i) => {
			team.load(snapshot.state.teams[i]);
			this.shader.updateScore(team.score, i);
			if (team.active)
				this.shader.changeBallOwner(this.level.goalBorderColors[i]);
		});
		this.finished = snapshot.state.finished;
		super.load(snapshot);
	}

	public getPaddle(userId?: number): Paddle | null {
		return this.paddles.find((paddle) => paddle.userId === userId) ?? null;
	}

	public lateTick() {
		let time = 1;
		const maxSpeed = 30;
		while (time > 0) {
			let collisionLines: Line[] = [];
			collisionLines.push(...this.field.getCollisionLines());
			this.paddles.forEach((paddle) => {
				collisionLines.push(...paddle.getCollisionLines());
			});
			
			const collision = this.ball.collision(collisionLines);
			if (collision === null || collision[2] > time + 0.001) {
				this.ball.position = this.ball.position.add(this.ball.velocity.scale(time));
				break;
			} else if (collision[0].name.startsWith("goal")) {
				this.pray("score-sound", 30, () => (scoreSound.cloneNode(true) as HTMLAudioElement).play());
				let goal: number = +collision[0].name.charAt(4);
				let act = goal;
				if (this.level.players > 2) {
					this.teams[goal].score -= 1;
					this.teams[goal].active = true;
				}
				else {
					this.teams[goal].score += 1;
					act = goal ? 0 : 1;
					this.teams[act].active = true;
				}
				if (Math.abs(this.teams[goal].score) >= 10) {
					this.teams[act].active = false;
					this.finished = true;
				}
				this.shader.updateScore(this.teams[goal].score, goal);
				this.ball.position = new Vector(FIELDWIDTH / 2, FIELDHEIGHT / 2);
				this.ball.velocity = new Vector(0,0);
				this.shader.changeBallOwner(this.level.goalBorderColors[act]);
				break;
			} else {
				if (collision[0].name.startsWith("paddle")) {
					this.bounceBall(collision,  new Vector(0, 0));
				}
				else {
					this.pray("wall-sound", 30, () => (wall.cloneNode(true) as HTMLAudioElement).play());
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
				paddle.userId = undefined;
			}
		}

		if (this.ball.position.x < -4 * border || this.ball.position.x > this.field.width + 4 * border ||
			this.ball.position.y < 0 || this.ball.position.y > this.field.height + 2 * border)
		{
			// console.log("ERROR: ball outside field. Resetting position.");
			this.ball.position = new Vector(WIDTH / 2, HEIGHT /2);
			this.ball.velocity = this.ball.velocity.tangent();
		}
		this.shader.moveBall(this.ball.position);
		this.teams.forEach((team) => {if (team.score >= 10) this.finished = true;});
		super.lateTick();
	}

	public async start(options: Options) {
		this.teams = [];
		let startScore = 0;
		if (this.players === GAME.FOURPLAYERS)
			startScore = 10;
		const teams = options.room.state!.teams;
		teams.sort((a, b) => a.id - b.id);
		for (let i = 0; i < this.level.players; i++) {
			this.teams.push(new Team(teams[i].id, teams[i].active, teams[i].score));
			if (teams[i].active) {
				this.shader.changeBallOwner(this.level.goalBorderColors[i]);
			}
			this.shader.updateScore(teams[i].score, i);
		}
		this.finished = options.room.state!.finished;

		let index = 0;
		for (let paddle of this.level.paddles) {
			this.paddles.push(new Paddle(new Vector(paddle.x, paddle.y), paddle.angle, index, this.teams[index], this.level.paddleContour))
			this.shader.movePaddle(this.paddles[index].position, index);
			this.shader.rotatePaddle(paddle.angle, index);
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
	private shader?: FullShader;
	private game: Game | null;
	private lastTime?: number;
	private players: GAME;
	private field: level | null;
	private interval?: number;
	private options?: Options;

	public async init(canvas: HTMLCanvasElement) {
		const rest = await fetch(levels[this.players]).then(res => res.json()).then(data => {
			this.field = data;
			this.shader = new FullShader(canvas, data);
			this.game = new Game(this.players, this.field!, this.shader);
			this.shader?.addEventListener(this);
		});
		
	}

	public constructor(players: number) {
		this.players = players;
		this.field = null;
		this.game = null;
	}

	public update(time: number) {
		this.lastTime ||= time;
		while (time - this.lastTime > 1000 / UPS) {
			this.game?.tick();
			this.lastTime += 1000 / UPS;
		}
		this.shader?.render(time);
	}

	public async start(options: Options) {
		this.options = options;
		this.interval = setInterval(() => {
			this.game?.send("ping", {
				u: options.member.userId,
			});
		}, 1000 / UPS * PADDLE_PING_INTERVAL);

		await this.game?.start(options);
	}

	public mousemove(moveX: number, moveY: number) {
		if (!this.options) {
			return;
		}
		if (this.options.member.player != null) {
			if (this.game) {
				let paddle = this.game.getPaddle(this.options.member.userId);

				let movement = {x: 0, y: 0};
				if (paddle?.isInPlayerArea({x: paddle.position.x + moveX, y: paddle.position.y}, this.game.field.getPlayerAreas()[paddle.owner]))
					movement.x = moveX;
				if (paddle?.isInPlayerArea({x: paddle.position.x, y: paddle.position.y + moveY}, this.game.field.getPlayerAreas()[paddle.owner]))
					movement.y = moveY;
				this.game!.send("mousemove", {
					u: this.options.member.userId,
					x: serializeNumber(movement.x),
					y: serializeNumber(movement.y),
					t: this.options.member.player?.teamId,
				});
			}
		}
	}

	public mouseWheel(deltaY: number) {
		if (!this.options) {
			return;
		}
		if (this.options.member.player != null && this.players === GAME.FOURPLAYERS) {
			let rot = 0;
			if (this.game) {
				let paddle = this.game.getPaddle(this.options.member.userId);
				if (paddle?.isInPlayerAreaRot(paddle.rotation + deltaY, this.game.field.getPlayerAreas()[paddle.owner]))
					rot = deltaY;
			}
			
			this.game!.send("mousescroll", {
				u: this.options.member.userId,
				x: serializeNumber(0),
				y: serializeNumber(0),
				t: this.options.member.player?.team?.id,
				r: serializeNumber(rot),
			});
		}
	}

	public mouseClick(button: number) {
		if (!this.options) {
			return;
		}

		if (this.options.member.player != null) {
			this.game!.send("mouseclick", {
				u: this.options.member.userId,
				x: serializeNumber(0),
				y: serializeNumber(0),
				t: this.options.member.player?.team?.id,
				r: serializeNumber(0),
				b: button,
			});
		}
	}

	public stop() {
		this.game!.stop();
		clearInterval(this.interval);
		music.loop = false;
		music.muted = true;
	}
}
