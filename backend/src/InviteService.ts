import { Controller } from "@nestjs/common";
import { Repository } from "typeorm";
import { dataSource } from "./app.module";
import { Invite } from "./entities/Invite";

export class InviteService<T extends Invite> {
	repository: Repository<Invite>;

	constructor(private type: (new () => T)) {
		this.repository = dataSource.getRepository(Invite);
	};

}
