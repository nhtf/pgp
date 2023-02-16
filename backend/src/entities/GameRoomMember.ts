import { ChildEntity, OneToOne } from "typeorm";
import { Member } from "./Member";
import { Player } from "./Player";

@ChildEntity()
export class GameRoomMember extends Member {
	@OneToOne(() => Player, (player) => player.member, { nullable: true, eager: true, cascade: [ "insert", "update" ] })
	player: Player | null;
}
