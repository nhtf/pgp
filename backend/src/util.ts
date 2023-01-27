import {
	createParamDecorator,
	ExecutionContext,
	HttpException,
	HttpStatus,
	PipeTransform,
	ArgumentMetadata,
	Injectable,
	CanActivate,
	Inject,
} from '@nestjs/common';
import { User } from './entities/User';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { Repository, FindOptionsWhere } from "typeorm";
import isNumeric from 'validator/lib/isNumeric';
import isLength from 'validator/lib/isLength';

export const Me = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const user = ctx.switchToHttp().getRequest().user;
	
		if (!user)
			throw new HttpException('unauthorized', HttpStatus.UNAUTHORIZED);

		return user;
	}
);

export function validate_id(value: any) {
	if (!value || value === null)
		throw new Error("id not undefined");
	if (!['string', 'number'].includes(typeof value))
		throw new Error("id must be either a string or a number");
	if (typeof value === "string" && !isNumeric(value, { no_symbols: true }))
		throw new Error("id must consist of only digits");
	const id = Number(value);
	if (!isFinite(id))
		throw new Error("id must be finite");
	if (id > Number.MAX_SAFE_INTEGER)
		throw new Error(`id may not be larger than ${Number.MAX_SAFE_INTEGER}`);
	return id;
}

//@deprecated
export async function parseId<T>(type: (new () => T), value: any, repo: Repository<T>) {
	if (!value || value === null)
		throw new HttpException('id not specified', HttpStatus.BAD_REQUEST);
	if (!['string', 'number'].includes(typeof value))
		throw new HttpException('id must be either a string or a number', HttpStatus.BAD_REQUEST);
	if (typeof value === "string") {
		if (!isNumeric(value, { no_symbols: true }))
			throw new HttpException('id must consist of only digits', HttpStatus.BAD_REQUEST);
	}
	const id = Number(value);
	if (!isFinite(id))
		throw new HttpException('id must be finite', HttpStatus.UNPROCESSABLE_ENTITY);
	if (id > Number.MAX_SAFE_INTEGER)
		throw new HttpException(`id may not be larger that ${Number.MAX_SAFE_INTEGER}`, HttpStatus.UNPROCESSABLE_ENTITY);
	const entity = await repo.findOneBy({ id: Number(value) } as unknown as FindOptionsWhere<T>);
	if (!entity)
		throw new HttpException('not found', HttpStatus.NOT_FOUND);
	return entity;
}

export function ParseIDPipe<T>(type: (new () => T)) {
	@Injectable()
	class ParseIDPipe implements PipeTransform {
		constructor(
			@Inject(type.name.toString().toUpperCase() + "_REPO")
			readonly repo: Repository<T>
		) {}

		async transform(value: any, metadata: ArgumentMetadata) {
			try {
				const id = validate_id(value);
				const entity = await this.repo.findOneBy({ id: id } as unknown as FindOptionsWhere<T>);
				if (!entity)
					throw new HttpException("not found", HttpStatus.NOT_FOUND);
				return entity;
			} catch (error) {
				throw new HttpException(error, HttpStatus.BAD_REQUEST);
			}
		}
	};
	return ParseIDPipe;
}

//TODO do not allow whitespaces in username=
@Injectable()
export class ParseUsernamePipe implements PipeTransform {
	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>
	) {}

	async transform(value: any, metadata: ArgumentMetadata) {
		if (!value || value === null)
			throw new HttpException('username not specified', HttpStatus.BAD_REQUEST);
		if (typeof value !== 'string')
			throw new HttpException('username must be a string', HttpStatus.BAD_REQUEST);
		if (!isLength(value, { min: 3, max: 20 }))
			throw new HttpException('username must be 3 to 20 characters long', HttpStatus.BAD_REQUEST);
		const entity = await this.user_repo.findOneBy({ username: value });
		if (!entity)
			throw new HttpException('user not found', HttpStatus.NOT_FOUND);
		return entity;
	}
}
