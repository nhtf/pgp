import type { User } from "src/entities/User";
import type { SessionObject } from "src/services/session.service";
import type { Repository } from "typeorm";

export async function authenticate(session: SessionObject, user_repo: Repository<User>): Promise<boolean> {
	const id = session?.user_id;

	if (!id)
		return false;
	const user = await user_repo.findOneBy({ id });
	if (!user)
		return false;
	return user.auth_req === session.auth_level;
}

