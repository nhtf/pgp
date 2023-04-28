import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { AchievementProgress } from "./AchievementProgress";
import { Objective } from "./Objective";
import { Exclude } from "class-transformer"

@Entity()
export class Achievement {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	image: string;

	@Column()
	max: number;

	@OneToMany(() => Objective, (objective) => objective.achievement, { eager: true, cascade: true })
	objectives: Objective[];

	@OneToMany(() => AchievementProgress, (progress) => progress.achievement, { nullable: false })
	progress: AchievementProgress[];
}
