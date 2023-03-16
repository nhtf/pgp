import { Controller, ForbiddenException, UseGuards, Post, Inject, Body, Get, Delete, Param } from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "src/entities/User";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";
import { HumanGuard } from "src/guards/bot.guard";
import { Me, UsernameDTO, AuthDTO, ParseIDPipe } from "src/util";
import { randomBytes } from "node:crypto";
import * as argon2 from "argon2";
import { instanceToPlain } from "class-transformer";

async function asyncRandomBytes(size: number): Promise<Buffer> {
	return new Promise((resolve: (value: Buffer) => void, reject: (error) => void) => {
		randomBytes(size, (err: Error, buf: Buffer) => {
			if (err)
				reject(err);
			else
				resolve(buf);
		});
	});
}

const TYPEORM_DUPLICATE = 23505;
const BOT_API_KEYSIZE = 32;

@Controller("bot(s)?")
@UseGuards(HttpAuthGuard, SetupGuard, HumanGuard)
export class BotController {
	constructor(@Inject("USER_REPO") private readonly user_repo: Repository<User>) {}

	@Get()
	async list_bots(@Me() me: User) {
		return this.user_repo.findBy({ owner: { id: me.id } });
	}

	@Post()
	async create_bot(@Me() me: User, @Body() dto: UsernameDTO) {
		let user = new User();
		const secret = await asyncRandomBytes(BOT_API_KEYSIZE);

		user.username = dto.username;
		user.api_secret = await argon2.hash(secret);
		user.owner = me;

		const tmp = new AuthDTO();

		try {
			user = await this.user_repo.save(user);
		} catch (err) {
			if (err.code == TYPEORM_DUPLICATE)
				throw new ForbiddenException("Username taken");
			throw new Error(err);
		}
		tmp.id = user.id;
		tmp.secret = secret.toString("base64");
		const key = Buffer.from(JSON.stringify(tmp)).toString("base64");
		return {
			...instanceToPlain(user),
			key,
		};
	}

	@Delete(":id")
	async delete_bot(
		@Me() me: User,
		@Param("id", ParseIDPipe(User, { owner: true })) bot: User
	) {
		if (bot.owner.id !== me.id)
			throw new ForbiddenException();
		await this.user_repo.remove(bot);
		return {};
	}

	@Get(":id")
	async regenerate_secret(
		@Me() me: User,
		@Param("id", ParseIDPipe(User, { owner: true })) bot: User
	) {
		if (bot.owner.id !== me.id)
			throw new ForbiddenException();

		const secret = await asyncRandomBytes(BOT_API_KEYSIZE);
		bot.api_secret = await argon2.hash(secret);
		return { secret };
	}
}
