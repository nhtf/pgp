import type { User } from "src/entities/User";
import type { IncomingMessage } from "http";
import type { Repository } from "typeorm";
import { AUTH_SECRET } from "src/vars";
import isBase64 from "validator/lib/isBase64";
import isJSON from "validator/lib/isJSON";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import * as argon2 from "argon2";
import { AuthDTO } from "src/util";
import { HttpStatus } from "@nestjs/common";

export async function authenticateOrReject(request: IncomingMessage, get_user: (id: number) =>  Promise<User | null>): Promise<User> {
	let key = request.headers?.authorization;

	if (key) {
		if (!key.startsWith("Bearer "))
			throw { message: "Invalid scheme", code: HttpStatus.BAD_REQUEST};
		key = key.slice(7).trim();

		if (!isBase64(key))
			throw { message: "Invalid key", code: HttpStatus.BAD_REQUEST };

		const info = Buffer.from(key, "base64").toString();
		if (!isJSON(info))
			throw { message: "Invalid key", code: HttpStatus.BAD_REQUEST };

		const dto = plainToClass(AuthDTO, JSON.parse(info));
		if ((await validate(dto)).length !== 0)
			throw { message: "Invalid key", code: HttpStatus.BAD_REQUEST };
		const user = await get_user(dto.id);

		if (!user)
			throw { message: "Not found", code: HttpStatus.NOT_FOUND };
		try {
			if (!user.is_bot || !(await argon2.verify(user.api_secret, Buffer.from(dto.secret, "base64"))))
				throw { message: "Unauthorized", code: HttpStatus.UNAUTHORIZED };
		} catch (err) {
			if (err.code == HttpStatus.UNAUTHORIZED)
				throw err;
			throw { message: "Internal error", code: HttpStatus.INTERNAL_SERVER_ERROR };
		}

		return user;
	} else if (request.session?.user_id) {
		const session = request.session;
		const id = session?.user_id;

		const user = await get_user(Number(id));
		if (!user)
			throw { message: "Not found", code: HttpStatus.NOT_FOUND };
		if (user.auth_req <= session.auth_level)
			return user;
		if (!id)
			throw { message: "Unauthorized", code: HttpStatus.UNAUTHORIZED };
	} else {
		throw { message: "No key", code: HttpStatus.UNPROCESSABLE_ENTITY };
	}
}

export async function authenticate(request: IncomingMessage, user_repo: Repository<User>): Promise<User | null> {
	try {
		return await authenticateOrReject(request, (id) => user_repo.findOneBy({ id }));
	} catch {
		return null;
	}
}
