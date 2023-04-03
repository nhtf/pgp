import type { Message } from "src/entities/Message";
import { GenericRoomService, CreateRoomOptions } from "src/services/new.room.service";
import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { ChatRoom } from "src/entities/ChatRoom";
import { ChatRoomMember } from "src/entities/ChatRoomMember";
import { EMBED_MAXLENGTH, EMBED_ALGORITHM, BOUNCER_KEY, BOUNCER_MAX_REDIRECTS, BOUNCER_ADDRESS } from "src/vars";
import { createHmac } from "node:crypto";
import { Embed } from "src/entities/Embed";
import { HttpService } from "@nestjs/axios";
import axios from "axios";
import type { User } from "src/entities/User";

@Injectable()
export class ChatRoomService extends GenericRoomService<ChatRoom, ChatRoomMember, CreateRoomOptions>(ChatRoom, ChatRoomMember) {
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

	async get_messages(room: ChatRoom): Promise<Message[]> {
		return this.message_repo.findBy({ room: { id: room.id } });
	}

	async add_messages(room: ChatRoom, ...messages: Message[]) {
		room = await this.find(room, { messages: true });

		room.messages.push(...messages);
	
		await this.message_repo.save(messages);
		// return this.room_repo.save(room);
	}

	async remove_messages(...messages: Message[]) {
		await this.message_repo.remove(messages);
	}

	async create_embed(url: URL): Promise<Embed | null> {
		try {
			const response = await axios.head(url.toString(), { maxContentLength: EMBED_MAXLENGTH, maxRedirects: BOUNCER_MAX_REDIRECTS });

			const mime = response.headers["content-type"];
			if (!mime)
				return null;

			const embed = new Embed();
			embed.url = url.toString();
			embed.digest = createHmac(EMBED_ALGORITHM, BOUNCER_KEY).update(embed.url).digest("hex");
			embed.rich = mime.startsWith("text/html");

			return embed;
		} catch {
			return null;
		}
	}

	async get_users(room: ChatRoom): Promise<User[]> {
		const members: ChatRoomMember[] = await this.member_repo.find({
			relations: {
				user: true,
			},
			where: {
				room: {
					id: room.id,
				}
			}
		});
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

		const users = [...members.map((member) => member.user), ...messages.map((message) => message.user)];
		const unique = new Map(users.map((user) => [user.id, user]));

		return [...unique.values()];
	}
}
