import {
	createParamDecorator,
	ExecutionContext,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { User } from './entities/User';
import { dataSource } from './app.module';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { validate } from 'class-validator';
import { Length, IsString, IsOptional, IsNumberString } from 'class-validator';
import { Console } from 'console';

class UserDTO {
	@IsString()
	@Length(1, 20)
	@IsOptional()
	username?: string;

	@IsNumberString()
	@IsOptional()
	user_id?: number;
}

async function GetUserByDTO(dto: UserDTO) {
	const result = await validate(dto);

	if (result.length !== 0) {
		throw new HttpException(result[0].constraints, HttpStatus.BAD_REQUEST);
	}

	if (!dto.username && !dto.user_id) {
		throw new HttpException(
			'either username or user_id has to be set',
			HttpStatus.BAD_REQUEST,
		);
	}

	const user = await dataSource.getRepository(User).findOneBy(dto);
	if (!user) {
		console.log(404);
		
		throw new HttpException('user not found', HttpStatus.NOT_FOUND);
	}

	return user;
}

export const Repo = createParamDecorator(
	async (where: EntityTarget<ObjectLiteral>, ctx: ExecutionContext) => {
		return dataSource.getRepository(where);
	},
);

export const GetUserQuery = createParamDecorator(
	async (data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const dto = new UserDTO();

		if (request.query.username) {
			dto.username = request.query.username
		}
		if (request.query.user_id) {
			dto.user_id = request.query.user_id
		}

		return GetUserByDTO(dto);
	},
);

export const GetUser = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = await dataSource
			.getRepository(User)
			.findOneBy({ user_id: request.session.user_id });

		if (!user) {
			throw new HttpException('user not found', HttpStatus.NOT_FOUND);
		}

		return user;
	},
);
