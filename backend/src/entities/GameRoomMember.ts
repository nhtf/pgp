import { ChildEntity } from "typeorm";
import { Member } from "./Member";

@ChildEntity()
export class GameRoomMember extends Member {

}
