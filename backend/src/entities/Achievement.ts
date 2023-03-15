import { Entity, Tree, TreeChildren, TreeParent, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { Objective } from "./Objective";
import { AchievementProgress } from "./AchievementProgress";

@Entity()
export class Achievement {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	description: string;

	@Column({
	    nullable: true
	})
	image: string | null;

	@Column({
	    nullable: true
	})
	max: number | null;

	@OneToMany(() => Objective, (objective) => objective.achievement)
	objectives: Objective[];

	@OneToMany(() => AchievementProgress, (progress) => progress.achievement, { nullable: false })
	progress: AchievementProgress[];
}
