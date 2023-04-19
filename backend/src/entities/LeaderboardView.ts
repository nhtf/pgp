import { ViewEntity, ViewColumn } from "typeorm";
import type { Gamemode } from "src/enums";

@ViewEntity({
	expression: `
	SELECT
	"user"."id",
	"user"."username",
	"user"."gamemode",
	"user"."team_count",
	"user"."ranked",
	"user"."wins"::INTEGER,
	"user"."losses"::INTEGER,
	"user"."draws"::INTEGER,
	("user"."wins" + "user"."draws" * 0.5) / GREATEST("wins" + "draws" + "losses", 10)::FLOAT AS "rank"
	FROM (
		SELECT
		"user"."id",
		"user"."username",
		"user"."gamemode",
		"user"."team_count",
		"user"."ranked",
		SUM(CAST("delta" > 0 AS INT)) AS "wins",
		SUM(CAST("delta" < 0 AS INT)) AS "losses",
		SUM(CAST("delta" = 0 AS INT)) AS "draws"
		FROM (
			SELECT
			"user".*,
			"state"."gamemode",
			"state"."team_count",
			"state"."ranked",
			"team"."score" - MAX("other"."score") AS "delta"
			FROM "team"
			LEFT JOIN "team" "other"
				ON "team"."stateId" = "other"."stateId"
				AND "team"."id" != "other"."id"
			LEFT JOIN "player"
				ON "player"."teamId" = "team"."id"
			INNER JOIN "user"
				ON "player"."userId" = "user"."id"
			INNER JOIN "game_state" "state"
				ON "team"."stateId" = "state"."id"
			WHERE "state"."finished"
			GROUP BY "user"."id", "state"."gamemode", "state"."team_count", "state"."ranked", "team"."id"
		) AS "user"
		GROUP BY "user"."id", "user"."username", "user"."gamemode", "user"."team_count", "user"."ranked"
	) AS "user"
	`
})
export class LeaderboardView {
	@ViewColumn()
	id: number;

	@ViewColumn()
	username: string;

	@ViewColumn()
	gamemode: Gamemode;

	@ViewColumn()
	team_count: number;

	@ViewColumn()
	wins: number;

	@ViewColumn()
	losses: number;

	@ViewColumn()
	draws: number;

	@ViewColumn()
	rank: number;
}
