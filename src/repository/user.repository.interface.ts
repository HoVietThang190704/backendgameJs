import { CreateUserDto } from "../dto/user.dto";
import { User } from "../model/user";

export interface IUserRepository {
  createUser (user: CreateUserDto): Promise<User>;
  getUserByEmail (email: string): Promise<User | null>;
  getUserById (id: string, projection?: string): Promise<User | null>;
  setCurrentMatch(userId: string, matchId: string | null): Promise<void>;
  getTopUsers(limit: number): Promise<User[]>;
  countUsersWithHigherRank(rank: number): Promise<number>;
  searchUsersByName(name: string, limit?: number): Promise<User[]>;
}
