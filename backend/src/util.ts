import {
	createParamDecorator,
	ExecutionContext,
	HttpException,
	HttpStatus,
	PipeTransform,
	ArgumentMetadata,
	Injectable,
	Inject,
	BadRequestException,
} from "@nestjs/common";
import { User } from "./entities/User";
import { Repository, FindOptionsWhere, FindOptionsRelations } from "typeorm";
import { Status } from "src/enums";
import { IDLE_TIME, OFFLINE_TIME } from "./vars";
import isNumeric from "validator/lib/isNumeric";
import isLength from "validator/lib/isLength";

export function get_status(last_activity: Date): Status {
	const last = Date.now() - last_activity.getTime();

	return last >= OFFLINE_TIME ?
		Status.OFFLINE : last >= IDLE_TIME ?
			Status.IDLE : Status.ACTIVE;
}


export const Me = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const user = ctx.switchToHttp().getRequest().user;

		if (!user)
			throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

		return user;
	}
);

export function validate_id(value: any) {
	if (value === null || value === undefined)
		throw new Error("id not defined");
	if (!["string", "number"].includes(typeof value))
		throw new Error("id must be either a string or a number");
	if (typeof value === "string" && !isNumeric(value, { no_symbols: true }))
		throw new Error("id must consist of only digits");
	const id = Number(value);
	if (!isFinite(id))
		throw new Error("id must be finite");
	if (id > 2 ** 31 - 1)
		throw new Error(`id may not be larger than ${2 ** 31 - 1}`);
	return id;
}

export async function parseId<T>(type: (new () => T), value: any, repo: Repository<T>) {
	const entity = await repo.findOneBy({ id: validate_id(value) } as unknown as FindOptionsWhere<T>);
	if (!entity)
		throw new HttpException("not found", HttpStatus.NOT_FOUND);
	return entity;
}

export function ParseIDPipe<T>(type: (new () => T), relations?: FindOptionsRelations<T>) {
	@Injectable()
	class ParseIDPipe implements PipeTransform {
		constructor(
			@Inject(type.name.toString().toUpperCase() + "_REPO")
			readonly repo: Repository<T>
		) { }

		async transform(value: any, metadata: ArgumentMetadata) {
			try {
				const id = validate_id(value);
				const entity = await this.repo.findOne({
					relations,
					where: {
						id,
					} as unknown as FindOptionsWhere<T>,
				});
				if (!entity)
					throw new HttpException("not found", HttpStatus.NOT_FOUND);
				return entity;
			} catch (error) {
				throw new BadRequestException(error.message);
			}
		}
	};
	return ParseIDPipe;
}

export function ParseOptionalIDPipe<T>(type: (new () => T), relations?: FindOptionsRelations<T>) {
	@Injectable()
	class ParseOptionalIDPipe extends ParseIDPipe(type, relations) {
		async transform(value: any, metadata: ArgumentMetadata) {
			if (value === null || value === undefined)
				return undefined;
			return await super.transform(value, metadata);
		}
	};
	return ParseOptionalIDPipe;
}

@Injectable()
export class ParseUsernamePipe implements PipeTransform {
	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>
	) { }

	async transform(value: any, metadata: ArgumentMetadata) {
		if (!value || value === null)
			throw new HttpException("username not specified", HttpStatus.BAD_REQUEST);
		if (typeof value !== "string")
			throw new HttpException("username must be a string", HttpStatus.BAD_REQUEST);
		if (!isLength(value, { min: 3, max: 20 }))
			throw new HttpException("username must be 3 to 20 characters long", HttpStatus.BAD_REQUEST);
		const entity = await this.user_repo.findOneBy({ username: value });
		if (!entity)
			throw new HttpException("user not found", HttpStatus.NOT_FOUND);
		return entity;
	}
}
