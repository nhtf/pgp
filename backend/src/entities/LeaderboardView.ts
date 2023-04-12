import { ViewEntity, ViewColumn } from "typeorm";
import type { Gamemode } from "src/enums";

//TODO only count finished games
@ViewEntity({
	expression: `
	SELECT
	"user"."id",
	"user"."username",
	"user"."gamemode",
	"user"."team_count",
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
		SUM(CASE WHEN "delta" > 0 THEN 1 ELSE 0 END) AS "wins",
		SUM(CASE WHEN "delta" < 0 THEN 1 ELSE 0 END) AS "losses",
		SUM(CASE WHEN "delta" = 0 THEN 1 ELSE 0 END) AS "draws"
		FROM (
			SELECT
			"user".*,
			"state"."gamemode",
			"state"."team_count",
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
			GROUP BY "user"."id", "state"."gamemode", "state"."team_count", "team"."id"
		) AS "user"
		GROUP BY "user"."id", "user"."username", "user"."gamemode", "user"."team_count"
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
