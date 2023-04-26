import type { Message } from "src/entities/Message";
import type { User } from "src/entities/User";
import { GenericRoomService, CreateRoomOptions, AddMemberType } from "src/services/room.service";
import { Injectable, Inject } from "@nestjs/common";
import { Repository, IsNull, In } from "typeorm";
import { ChatRoom } from "src/entities/ChatRoom";
import { ChatRoomMember } from "src/entities/ChatRoomMember";
import { EMBED_MAXLENGTH, BOUNCER_MAX_REDIRECTS } from "src/vars";
import { Embed } from "src/entities/Embed";
import { get_bouncer_digest } from  "src/util";
import axios from "axios";

export interface CreateChatRoomOptions extends CreateRoomOptions {
	name?: string;
	is_private?: boolean;
	password?: string;
	is_dm: boolean;
}

@Injectable()
export class ChatRoomService extends GenericRoomService<ChatRoom, ChatRoomMember, CreateChatRoomOptions>(ChatRoom, ChatRoomMember) {
	constructor(
		@Inject("CHATROOM_REPO")
		room_repo: Repository<ChatRoom>,
		@Inject("CHATROOMMEMBER_REPO")
		member_repo: Repository<ChatRoomMember>,
		@Inject("MESSAGE_REPO")
		private readonly message_repo: Repository<Message>,
	) {
		super(room_repo, member_repo);
	}

	async add_members(room: ChatRoom, ...members: AddMemberType[]): Promise<ChatRoomMember[]> {
		const userIds = members.map(({ user }) => user.id);
	
		const added = await super.add_members(room, ...members);
		const orphans = await this.message_repo.findBy({ member: IsNull(), user: In(userIds) });

		orphans.forEach((message) => {
			message.member = added.find(({ user }) => user.id === message.userId)!;
		});

		await this.message_repo.save(orphans);

		return added;
	}

	async create(options: CreateChatRoomOptions) {
		const room = await super.create(options);

		room.is_dm = options.is_dm ?? false;
		return this.room_repo.save(room);
	}

	async get_messages(room: ChatRoom): Promise<Message[]> {
		return this.message_repo.findBy({ room: { id: room.id } });
	}

	async add_messages(room: ChatRoom, ...messages: Message[]) {
		room = await this.find(room, { messages: true });

		room.messages.push(...messages);
	
		await this.message_repo.save(messages);
	}

	async remove_messages(...messages: Message[]) {
		await this.message_repo.remove(messages);
	}

	async create_embed(url: URL): Promise<Embed | null> {
		try {
			const response = await axios.head(url.toString(), {
				maxContentLength: EMBED_MAXLENGTH,
				maxRedirects: BOUNCER_MAX_REDIRECTS
			});

			const mime = response.headers["content-type"];
			if (!mime)
				return null;

			const embed = new Embed();
			embed.url = url.toString();
			embed.digest = get_bouncer_digest(url);
			embed.rich = mime.startsWith("text/html");

			return embed;
		} catch {
			return null;
		}
	}

	async get_users(room: ChatRoom): Promise<User[]> {
		const from_members = await super.get_users(room);
		const messages = await this.message_repo.find({
			relations: {
				user: true,
			},
			where: {
				member: null,
				room: {
					id: room.id,
				},
			},
		});

		const users = [...from_members, ...messages.map((message) => message.user)];
		const unique = new Map(users.map((user) => [user.id, user]));

		return [...unique.values()];
	}
}
