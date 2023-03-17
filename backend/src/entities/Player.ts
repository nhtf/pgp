import { Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, JoinColumn, RelationId } from "typeorm";
import { GameRoomMember } from "./GameRoomMember";
import { Team } from "./Team";
import { User } from "./User";

@Entity()
export class Player {
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

	@OneToOne(() => GameRoomMember, (member) => member.player, { cascade: ["insert", "update"], nullable: true, onDelete: "SET NULL" })
	@JoinColumn()
	member: GameRoomMember | null;
}
