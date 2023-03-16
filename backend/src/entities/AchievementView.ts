import { ViewEntity, ViewColumn } from "typeorm";
import type { Objective } from "./Objective";

@ViewEntity({
	expression: `
	SELECT "achievement"."id" as "id", "achievement"."name" as "name", "achievement"."description" as "description",
	"achievement"."max" as "max", "objective"."threshold" as "threshold", COALESCE ("achievement_progress"."progress", 0) as "progress",
	"user"."id" as "user_id" FROM "achievement" "achievement"
	LEFT JOIN "objective" "objective" ON "objective"."achievementId" = "achievement"."id"
	CROSS JOIN "user" "user"
	LEFT JOIN "achievement_progress" "achievement_progress" ON "achievement_progress"."userId" = "user"."id"
	WHERE "user"."api_secret" IS NULL
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
	max: number;

	@ViewColumn()
	threshold: number;

	@ViewColumn()
	progress: number;

	@ViewColumn()
	user_id: number;
}
