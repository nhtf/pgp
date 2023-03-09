import type { User } from "src/entities/User";
import type { IncomingMessage } from "http";
import type { Repository } from "typeorm";

export async function authenticate(request: IncomingMessage, user_repo: Repository<User>): Promise<User | null> {
	const session = request?.session;
	const id = session?.user_id;

	if (!id) {
		return null;
	}

	const user = await user_repo.findOneBy({ id });

	if (session.auth_level < user.auth_req) {
		return null;
	}
	
	return user;
}

