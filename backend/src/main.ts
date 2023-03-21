import * as dotenv from "dotenv";
dotenv.config();
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { HttpException, HttpStatus, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import {
	FRONTEND_ADDRESS,
	BACKEND_PORT,
} from "./vars";
import { join } from "path";
import { dataSource, sessionMiddleware } from "./app.module";
import { IoAdapter } from "@nestjs/platform-socket.io";
import * as compression from "compression";
import { Achievement } from "src/entities/Achievement";
import { Objective } from "src/entities/Objective";

interface ObjectiveDef {
	threshold: number,
	color: string,
	name: string,
	description: string,
}

interface AchievementDef {
	name: string,
	image: string,
	max: number,
	objectives: ObjectiveDef[],
}

const achievements: AchievementDef[] = [
	{
		name: "VR Pong",
		max: 4200,
		image: "/Assets/achievement-icons/vrpong.svg",
		objectives: [
			{
				name: "Enter the matrix",
				description: "Play a game of VR Pong",
				threshold: 1,
				color: "#cd7f32",
			},
			{
				name: "I'm getting the hang of this",
				description: "Play 50 games of VR Pong",
				threshold: 50,
				color: "#c0c0c0",
			},
			{
				name: "I am the metaverse",
				description: "Play 200 games of VR Pong",
				threshold: 200,
				color: "#ffd700",
			},
			{
				name: "No Game No Life",
				description: "Play 4200 games of VR Pong",
				threshold: 4200,
				color: "#99ffff",
			},
		],
	},
	{
		name: "Chatty",
		max: 5000,
		image: "/Assets/achievement-icons/chatroom.svg",
		objectives: [
			{
				name: "Hello world!",
				description: "Send a message in a chatroom",
				threshold: 1,
				color: "#cd7f32",
			},
			{
				name: "I know right?",
				description: "Send 100 messages in chatrooms",
				threshold: 100,
				color: "#c0c0c0",
			},
			{
				name: "Influencer",
				description: "Send 1000 messages in chatrooms",
				threshold: 1000,
				color: "#ffd700",
			},
			{
				name: "b.r.b.g.g.f.m.d",
				description: "Send 5000 messages in chatrooms",
				threshold: 5000,
				color: "#99ffff",
			},
		],
	},
	{
		name: "Loser",
		max: 20,
		image: "/Assets/achievement-icons/pong.svg",
		objectives: [
			{
				name: "placeholder",
				threshold: 5,
				color: "#FF00FF",
				description: "You lost 5 games",
			},
			{
				name: "placeholder",
				threshold: 10,
				color: "#FFFFFF",
				description: "You lost 10 games",
			},
		],
	},
	{
		name: "Popular",
		max: 15,
		image: "/Assets/achievement-icons/popular.svg",
		objectives: [
			{
				name: "placeholder",
				threshold: 5,
				color: "#FF00FF",
				description: "Made 5 friends",
			},
		],
	}
];

//https://docs.nestjs.com/websockets/adapter
//https://socket.io/get-started/chat
//https://socket.io/how-to/use-with-express-session
class BetterAdapter extends IoAdapter {
	createIOServer(port: number, options: any = {}):any {
		const server = super.createIOServer(port, options);
		const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
		server.use(wrap(sessionMiddleware));
		server.of("/room").use(wrap(sessionMiddleware));
		server.of("/game").use(wrap(sessionMiddleware));
		server.of("/update").use(wrap(sessionMiddleware));
		/*
		server.of("/room").on("connection", (socket) => {
			socket.on("disconnect", () => {
				console.log("disconnect");
			});
			console.log("connect");
		});
		*/
		return server;
	}
}

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	//app.use(compression());
	app.use(sessionMiddleware);
	app.enableCors({
		origin: FRONTEND_ADDRESS,
		credentials: true,
	});
	app.useGlobalPipes(
		new ValidationPipe({
			transform: false, // TODO: true
			forbidUnknownValues: false, // TODO: true
			/*
			exceptionFactory: (e) => {
				throw new HttpException("bad request", HttpStatus.BAD_REQUEST);
			}*/
		}),
	);
	const betterAdapter = new BetterAdapter(app);
	app.useWebSocketAdapter(betterAdapter);

	app.useStaticAssets(join(__dirname, "..", "avatar"), { prefix: "/avatar/" });

	const repo = dataSource.getRepository(Achievement);
	const tmp = await repo.find();
	const missing = achievements.filter((value) => !tmp.find((x) => x.name === value.name));
	await repo.save(missing.map((value) => {
		const achievement = new Achievement();

		achievement.name = value.name;
		achievement.max = value.max;
		achievement.image = value.image;

		achievement.objectives = value.objectives.map((obj) => {
			const objective = new Objective();

			objective.threshold = obj.threshold;
			objective.color = obj.color;
			objective.description = obj.description;
			objective.name = obj.name;
			return objective;
		});

		return achievement;
	}));
	
	app.listen(BACKEND_PORT);
}
bootstrap();
