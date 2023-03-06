import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class MatchHistory {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		default: 0,
	})
	wins: number;

	@Column({
		default: 0,
	})
	losses: number;
}