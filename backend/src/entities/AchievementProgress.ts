import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User";
import { Achievement } from "./Achievement";

@Entity()
export class AchievementProgress {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ default: 0 })
	progress: number;

	@Column({ default: 0})
	checkpoint: number;

	@ManyToOne(() => Achievement, (achievement) => achievement.progress, { eager: true, nullable : false })
	achievement: Achievement;

	@ManyToOne(() => User, (user) => user.achievements, { eager: true, nullable: false, onDelete: "CASCADE" })
	user: User;
}
