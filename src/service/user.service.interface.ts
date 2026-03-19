import { CreateUserDto } from "../dto/user.dto";
import { User } from "../model/user";

export interface IUserService {
  createUser (user: CreateUserDto): Promise<User>;
  getUserByEmail (email: string): Promise<User | null>;
  getUserById (id: string, projection?: string): Promise<User | null>;
  setCurrentMatch(userId: string, matchId: string | null): Promise<void>;
}