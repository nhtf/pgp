import { Controller, UseGuards, Inject, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { FindManyOptions, Repository } from "typeorm";
import { AuthGuard } from './auth/auth.guard';
import { SetupGuard } from "./account.controler";
import { User } from "./UserService";
import { GetUser } from "./util";
import { DEFAULT_AVATAR, BACKEND_ADDRESS, AVATAR_DIR } from "./vars";

type simple = {username: string; friend: boolean, avatar: string};

@Controller('game')
@UseGuards(AuthGuard)
export class GameController {
    constructor(@Inject('USER_REPO') private readonly repo: Repository<User>) {}

    @Get('onlineUsers')
	@UseGuards(SetupGuard)
	@HttpCode(HttpStatus.OK)
	async onlineUsers(@GetUser() user: User): Promise<simple[] | undefined> {
		const result = await this.repo.find({
            where: {
                online: true,
            }
		});
        // console.log(result);
		if (result == null)
			return undefined;
        let simpleUser: simple[] = [];
        await result.forEach((value) => {
            if (value.user_id !== user.user_id) {
                // console.log(value);
                let avatarPath: string;
                let isFriend: boolean = false;
                avatarPath = BACKEND_ADDRESS + '/' + AVATAR_DIR + '/';
                avatarPath += user.has_avatar ?  user.user_id: DEFAULT_AVATAR;
                avatarPath += '.jpg';

                (value.friends).then((dat) => {
                    dat?.forEach((lol) => {
                        if (lol === user)
                            isFriend = true;
                    })
                });
                if (value.username === 'chicken') {//TODO TEMP REMOVE DEBUG STUFF
                    console.log("hey");//TODO TEMP REMOVE DEBUG STUFF
                    isFriend = true;//TODO TEMP REMOVE DEBUG STUFF
                }//TODO TEMP REMOVE DEBUG STUFF
                const simple:simple = {username: value.username, friend: isFriend, avatar: avatarPath};
                simpleUser.push(simple);
            }
        });
		return simpleUser;
	}
}
