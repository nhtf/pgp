import { Exclude } from "class-transformer";
import { Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Team } from "./Team";
import { User } from "./User";
import { GameRoomMember } from "./GameRoomMember";

@Entity()
export class Player {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Team, (team) => team.players, { onDelete: "CASCADE", eager: true })
	team: Team;

	@ManyToOne(() => User, (user) => user.players, { onDelete: "CASCADE" })
	user: User;

	@OneToOne(() => GameRoomMember, (member) => member.player, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn()
	member: GameRoomMember | null;
}
