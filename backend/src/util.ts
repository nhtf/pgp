import {
	createParamDecorator,
	ExecutionContext,
	HttpException,
	HttpStatus,
	PipeTransform,
	ArgumentMetadata,
	Injectable,
	CanActivate
} from '@nestjs/common';
import { User } from './entities/User';
import { dataSource } from './app.module';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { validate } from 'class-validator';
import { Length, IsString, IsOptional, IsNumberString } from 'class-validator';
import isNumeric from 'validator/lib/isNumeric';
import { ChatRoom } from './entities/ChatRoom';

class RoomDTO {
	@IsNumberString()
	id: string;
}

class UserDTO {
	@IsString()
	@Length(1, 20)
	@IsOptional()
	username?: string;

	@IsNumberString()
	@IsOptional()
	id?: number;
}

@Injectable()
export class InjectUser implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const http = context.switchToHttp();
		const request = http.getRequest();
		const response = http.getResponse();
	
		if (request.session.user_id == undefined) {
			response.status(HttpStatus.UNAUTHORIZED).json("Unauthorized");
			return false;
		}
	
		const user = await dataSource.getRepository(User).findOneBy({
			id: request.session.user_id
		});
	
		request.user = user;
		return true;
	}
}

export async function GetUserByDTO(dto: UserDTO) {
	const result = await validate(dto);

	if (result.length !== 0) {
		throw new HttpException(result[0].constraints, HttpStatus.BAD_REQUEST);
	}

	if (!dto.username && !dto.id) {
		throw new HttpException(
			'either username or id has to be set',
			HttpStatus.BAD_REQUEST,
		);
	}

	const user = await dataSource.getRepository(User).findOneBy(dto);
	if (!user) {
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
		if (request.query.id) {
			dto.id = request.query.id
		}

		return GetUserByDTO(dto);
	},
);

export const GetUser = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = await dataSource
			.getRepository(User)
			.findOneBy({ id: request.session.user_id });

		if (!user) {
			throw new HttpException('user not found', HttpStatus.NOT_FOUND);
		}

		return user;
	},
);

export const Me = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const user = ctx.switchToHttp().getRequest().user;
		if (!user)
			throw new HttpException('unauthorized', HttpStatus.UNAUTHORIZED);
		return user;
	}
);

export const GetRoomQuery = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const dto = new RoomDTO;

		if (request.query.id) {
			dto.id = request.query.id;
		}

		return getRoomByDTO(dto);
	}
)

async function getRoomByDTO(dto: RoomDTO) {
	const result = await validate(dto);

	if (result.length != 0) {
		throw new HttpException(result[0].constraints, HttpStatus.BAD_REQUEST);
	}

	const room = await dataSource.getRepository(ChatRoom).findOneBy({ id: Number(dto.id) });
	if (!room) {
		throw new HttpException('room not found', HttpStatus.NOT_FOUND);
	}

	return room;
}

export function ParseIDPipe(type: any) {
	return class ParseIDPipe implements PipeTransform {
		async transform(value: any, metadata: ArgumentMetadata) {
			if (!value || value === null)
				throw new HttpException('id not specified', HttpStatus.BAD_REQUEST);
			if (!['string', 'number'].includes(typeof value))
				throw new HttpException('id must be either a string or an number', HttpStatus.BAD_REQUEST);
			if (!isNumeric(value, { no_symbols: true }))
				throw new HttpException('id must consist of only digits', HttpStatus.BAD_REQUEST);
			const id = Number(value);
			if (!isFinite(id))
				throw new HttpException('id must be finite', HttpStatus.UNPROCESSABLE_ENTITY);
			if (id > Number.MAX_SAFE_INTEGER)
				throw new HttpException(`id may not be larger that ${Number.MAX_SAFE_INTEGER}`, HttpStatus.UNPROCESSABLE_ENTITY);
			const entity = await dataSource.getRepository(type).findOneBy({ id: Number(value) });
			if (!entity)
				throw new HttpException('not found', HttpStatus.NOT_FOUND);
			return entity;
		}
	};
}

