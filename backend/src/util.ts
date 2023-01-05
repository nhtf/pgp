import { createParamDecorator, ExecutionContext, HttpException, HttpStatus,
	applyDecorators, UseGuards } from '@nestjs/common';
import { User } from './entities/User';
import { dataSource } from './app.module';
import { FindOptionsWhere, EntityTarget, ObjectLiteral } from 'typeorm';
import { validate } from 'class-validator';
import { Length, IsString, IsOptional, IsNumberString } from 'class-validator';
import { AuthGuard } from './auth/auth.guard';

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
		if (result.length !== 0)
			throw new HttpException(result[0].constraints, HttpStatus.BAD_REQUEST);
		if (!dto.username && !dto.user_id)
			throw new HttpException('either username or user_id has to be set', HttpStatus.BAD_REQUEST);

		const user = await dataSource.getRepository(User).findOneBy(dto);
		if (!user)
			throw new HttpException('user not found', HttpStatus.NOT_FOUND);
		return user;
}

export const Repo = createParamDecorator(
	async (where: EntityTarget<ObjectLiteral>, ctx: ExecutionContext) => {
		return dataSource.getRepository(where);
	}
);

export const GetUserQuery = createParamDecorator(
	async (where: { username?: string, user_id?: string }, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const dto = new UserDTO();

		if (where.username) {
			dto.username = request.query[where.username];
		} 
		if (where.user_id) {
			dto.user_id = request.query[where.user_id];
		}
		return GetUserByDTO(dto);
	}
);

export const GetUser = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = await dataSource.getRepository(User).findOneBy({ user_id: request.session.user_id });
		if (!user)
			throw new HttpException('user not found', HttpStatus.NOT_FOUND);
		return user;
	},
);
