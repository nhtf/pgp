import type { User } from "src/entities/User";
import type { IncomingMessage } from "http";
import type { Repository } from "typeorm";
import isJWT from "validator/lib/isJWT";
import * as jwt from "jsonwebtoken";
import { AUTH_SECRET } from "src/vars";

export async function authenticate(request: IncomingMessage, user_repo: Repository<User>): Promise<User | null> {
	const session = request?.session;

	let id = session?.user_id;
	if (!session) {
		try {
			const token = request?.headers.authorization;

			if (!token || !isJWT(token))
				return null;
			const data = jwt.verify(token, AUTH_SECRET);
			id = data["id"];
		} catch {
			return null;
		}
	}

	if (!id) {
		return null;
	}

	const user = await user_repo.findOne({
		where: { id },
		relations: {
			owner: true
		}
	});

	if (session.auth_level < user.auth_req) {
		return null;
	}

	return user;
}

