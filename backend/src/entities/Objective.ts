import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Achievement } from "./Achievement";

@Entity()
export class Objective {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column({
		default: "#FF00FF",
	})
	color: string;

	@Column()
	description: string;

	@Column()
	threshold: number;

	@ManyToOne(() => Achievement, (achievement) => achievement.objectives, { nullable: false, cascade: ["update", "insert"] })
	achievement: Achievement;
}
