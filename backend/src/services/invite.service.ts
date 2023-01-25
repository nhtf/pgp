import { Get, Inject, Injectable } from "@nestjs/common";
import { Invite } from "src/entities/Invite";
import { Repository } from "typeorm";

@Injectable()
export class InviteService {
	constructor(@Inject("INVITE_REPO") readonly inviteRepo: Repository<Invite>) {}

	@Get("invites")
	async invites() {

	}
}
