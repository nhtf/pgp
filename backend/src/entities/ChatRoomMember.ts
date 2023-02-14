import { ChildEntity } from "typeorm";
import { Member } from "./Member";

@ChildEntity()
export class ChatRoomMember extends Member {

}
