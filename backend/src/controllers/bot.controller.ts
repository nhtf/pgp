import { Controller, Get, Post, Delete, UseGuards, Inject, Body, ForbiddenException } from "@nestjs/common";
import { HttpAuthGuard } from "src/auth/auth.guard"; 
import { SetupGuard } from "src/guards/setup.guard"; 
import { Repository } from "typeorm";
import { HumanGuard } from "src/guards/bot.guard";
import { Me, UsernameDTO } from  "src/util";
import { randomBytes } from "node:crypto";
import * as argon2 from "argon2";
import { User } from "src/entities/User";

@Controller("bot(s)?")
@UseGuards(HttpAuthGuard, SetupGuard, HumanGuard)
export class BotController {
	constructor(@Inject("USER_REPO") private readonly userRepo: Repository<User>) {}

	@Post()
	async create(@Me() me: User, @Body() dto: UsernameDTO) {
		if (await this.userRepo.findOneBy({ username: dto.username }))
			throw new ForbiddenException("Name taken");

		const promise = new Promise((resolve: (buf: Buffer) => void, reject) => {
			randomBytes(32, (err, buf) => {
				if (err)
					reject(err);
				resolve(buf);
			});
		});

		const key = await promise;
		const bot = new User;
		bot.key = await argon2.hash(key);
		bot.username = dto.username;
		bot.owner = me;
		if (me.bots)
			me.bots.push(bot);
		else
			me.bots = [bot];
		await this.userRepo.save([bot, me]);
		return { id: bot.id, key: key.toString('base64') };
	}
}
