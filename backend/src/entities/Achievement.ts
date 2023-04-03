import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Objective } from "./Objective";
import { AchievementProgress } from "./AchievementProgress";

@Entity()
export class Achievement {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	image: string;

	@Column({ nullable: true })
	max: number | null;

	@OneToMany(() => Objective, (objective) => objective.achievement, { eager: true, cascade: true })
	objectives: Objective[];

	@OneToMany(() => AchievementProgress, (progress) => progress.achievement, { nullable: false })
	progress: AchievementProgress[];
}
