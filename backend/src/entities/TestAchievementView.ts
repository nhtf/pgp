import { ViewEntity, ViewColumn, DataSource } from "typeorm";
import type { Objective } from "./Objective";
import { Achievement } from "./Achievement";

@ViewEntity({
	expression: (dataSource: DataSource) => dataSource
		.createQueryBuilder()
		.select("achievement.id", "id")
		.addSelect("achievement.name", "name")
		.addSelect("achievement.image", "image")
		.addSelect("achievement.max", "max")
		.from(Achievement, "achievement")
})
export class TestAchievementView {
	@ViewColumn()
	id: number;

	@ViewColumn()
	name: string;

	@ViewColumn()
	description: string;

	@ViewColumn()
	image: string;

	@ViewColumn()
	max: number;

	@ViewColumn()
	objectives: { name: string, threshold: number, color: string }[];

	@ViewColumn()
	progress: number;

	@ViewColumn()
	user_id: number;
}
