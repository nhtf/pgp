import { Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Team } from "./Team";
import { User } from "./User";
import { GameRoomMember } from "./GameRoomMember";

@Entity()
export class Player {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Team, (team) => team.players, { onDelete: "CASCADE" })
	team: Team;

	@ManyToOne(() => User, (user) => user.players, { onDelete: "CASCADE" })
	user: User;

	@OneToOne(() => GameRoomMember, (member) => member.player, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn()
	member: GameRoomMember | null;
}
