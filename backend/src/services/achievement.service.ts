import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import type { Achievement } from "src/entities/Achievement";
import type { User } from "src/entities/User";
import { AchievementProgress } from "src/entities/AchievementProgress";

@Injectable()
export class AchievementService {
	constructor(
		@Inject("ACHIEVEMENT_REPO") private readonly achievement_repo: Repository<Achievement>,
		@Inject("ACHIEVEMENTPROGRESS_REPO") private readonly progress_repo: Repository<AchievementProgress>
	) {}

	async inc_progress(name: string, user: User, amount: number): Promise<number> {
		let progress = await this.progress_repo.findOneBy({
			achievement: {
				name,
			},
			user: {
				id: user.id
			},
		});
		if (!progress) {
			const achievement = await this.achievement_repo.findOneBy({ name });
			if (!achievement)
				throw new Error(`No achievement found by the name "${name}"`);
			progress = new AchievementProgress();
			progress.achievement = achievement;
			progress.user = user;
			progress.progress = 0;
		}

		const remaining = Math.abs(progress.achievement.max - progress.progress);
		if (remaining < amount)
			amount = remaining;
		if (progress.progress + amount < progress.checkpoint)
			amount = progress.checkpoint - progress.progress;
		progress.progress += amount;

		for (const obj of progress.achievement.objectives) {
			if (progress.progress >= obj.threshold && progress.checkpoint < obj.threshold)
				progress.checkpoint = obj.threshold;
		}
		await this.progress_repo.save(progress);
		return amount;
	}

	async inc_progresses(name: string, amount: number, users: User[]) {
		for (const user of users) {
			await this.inc_progress(name, user, amount);
		}
	}
}

