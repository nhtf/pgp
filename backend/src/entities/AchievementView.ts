import { ViewEntity, ViewColumn } from "typeorm";
import type { Objective } from "./Objective";

@ViewEntity({
	expression: `
	SELECT achievement."id" as "id",
	achievement.name as name, achievement.image as image, achievement.max as max,
	objective.name as objective_name, objective.description as description, objective.color as color, objective.threshold as threshold,
	"user"."id" as user_id,
	COALESCE(progress.progress, 0) as progress
	FROM achievement
	LEFT JOIN objective ON objective."achievementId" = achievement."id"
	CROSS JOIN "user"
	LEFT JOIN achievement_progress as progress
	ON progress."userId" = "user"."id"
	AND progress."achievementId" = achievement."id"
	WHERE "user".api_secret IS NULL
	ORDER BY "objective"."threshold";
	`,
})
export class AchievementView {
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
	objective_name: string;

	@ViewColumn()
	threshold: number;

	@ViewColumn()
	progress: number;

	@ViewColumn()
	color: string;

	@ViewColumn()
	user_id: number;
}
