import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/auth/auth.guard";
import { Invite, _RoomInvite } from "src/entities/Invite";
import { User } from "src/entities/User";
import { InjectUser, Me, ParseIDPipe, ParseUsernamePipe } from "src/util";
import { Repository } from "typeorm";

@Controller("invite(s)?")
@UseGuards(AuthGuard, InjectUser)
export class InviteController {
	constructor(@Inject('INVITE_REPO') private readonly inviteRepo: Repository<Invite>) {}

	@Get("all")
	async all() {
		const invites = await this.inviteRepo.find();
	
		return await Promise.all(invites.map((invite) => invite.serialize()));
	}

	@Get(":id")
	async byId(@Param("id", ParseIDPipe(Invite)) invite: Invite) {
		return await invite.serialize();
	}

	@Get()
	async mine(@Me() user: User) {
		const invites = await this.inviteRepo.findBy({ to: { id: user.id } });

		return await Promise.all(invites.map((invite) => invite.serialize()));
	}

	@Post()
	async invite(@Me() user: User, @Body("username", ParseUsernamePipe) invitee: User, @Body("type") type: string) {
		const invite = new Invite;

		invite.from = Promise.resolve(user);
		invite.to = Promise.resolve(invitee);

		return await this.inviteRepo.save(invite);

	}

}