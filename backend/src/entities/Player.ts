import { Exclude } from "class-transformer";
import { Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, JoinColumn, RelationId } from "typeorm";
import { Team } from "./Team";
import { User } from "./User";
import { GameRoomMember } from "./GameRoomMember";

@Entity()
export class Player {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Team, (team) => team.players, { onDelete: "CASCADE" })
	team: Team;

	@RelationId((player: Player) => player.team)
	teamId: number;

	@ManyToOne(() => User, (user) => user.players, { onDelete: "CASCADE" })
	user: User;

	@RelationId((player: Player) => player.user)
	userId: number;

	@OneToOne(() => GameRoomMember, (member) => member.player, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn()
	member: GameRoomMember | null;
}
