import { User } from './User';

export interface UserService {
	find(id: string): User | undefined;
	del(id: string): boolean;
}

