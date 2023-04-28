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
	SetMetadata,
} from "@nestjs/common";
import { User } from "./entities/User";
import { Repository, FindOptionsWhere, FindOptionsRelations, ObjectLiteral } from "typeorm";
import { Status } from "src/enums";
import { IDLE_TIME, OFFLINE_TIME, EMBED_ALGORITHM, BOUNCER_KEY, SCHEME, BOUNCER_ADDRESS } from "./vars"; //ODOT rename EMBED_ALGORITHM to BOUNCER_HASH_ALGO
import isNumeric from "validator/lib/isNumeric";
import { IsString, Matches, IsNumber, IsBase64 } from "class-validator";
import { createHmac } from "node:crypto";

export class UsernameDTO {
	@IsString()
	//@Length(3, 20)
	@Matches(/^(?!\0)\S(?:(?!\0)[ \S]){1,18}(?!\0)\S$/)
	username: string;
}

export class AuthDTO {
	@IsNumber()
	id: number;

	@IsString()
	@IsBase64()
	secret: string;
}

export function get_status(last_activity: Date): Status {
	const last = Date.now() - last_activity.getTime();

	return last >= OFFLINE_TIME ?
		Status.OFFLINE : last >= IDLE_TIME ?
			Status.IDLE : Status.ACTIVE;
}

export const TREE_KEY = "PGP_TREE";
export const TreeRepo = () => SetMetadata(TREE_KEY, true);

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

export async function parseId<T extends ObjectLiteral>(type: (new () => T), value: any, repo: Repository<T>) {
	const entity = await repo.findOneBy({ id: validate_id(value) } as unknown as FindOptionsWhere<T>);
	if (!entity)
		throw new HttpException("Not found", HttpStatus.NOT_FOUND);
	return entity;
}

export function ParseIDPipe<T extends ObjectLiteral>(type: (new () => T), relations?: any) {
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
					throw new HttpException("Not found", HttpStatus.NOT_FOUND);
				return entity;
			} catch (error) {
				throw new BadRequestException("Invalid id");
			}
		}
	};
	return ParseIDPipe;
}

export function ParseOptionalIDPipe<T extends ObjectLiteral>(type: (new () => T), relations?: FindOptionsRelations<T>) {
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


export function ParseUsernamePipe(relations?: any) {
	@Injectable()
	class ParseUsernamePipe implements PipeTransform {
		constructor(@Inject("USER_REPO") readonly userRepo: Repository<User>) {}

		async transform(value: any, metadata: ArgumentMetadata) {
			const entity = await this.userRepo.findOne({
				where: { username: value },
				relations,
			});
		
			if (!entity) {
				throw new HttpException("Not found", HttpStatus.NOT_FOUND);
			}

			return entity;
		}
	};
	return ParseUsernamePipe;
}

export function get_bouncer_digest(url: URL): string {
	return createHmac(EMBED_ALGORITHM, BOUNCER_KEY).update(url.toString()).digest("hex");
}

export function get_bouncer_proxy_url(url: URL) {
	return `${BOUNCER_ADDRESS}/${get_bouncer_digest(url)}/proxy?url=${encodeURIComponent(url.toString())}`;
}
