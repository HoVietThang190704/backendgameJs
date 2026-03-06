import { CreateUserDto } from "../dto/user.dto";
import { User } from "../model/user";

export interface IUserService {
  createUser (user: CreateUserDto): Promise<User>;
  getUserByEmail (email: string): Promise<User | null>;
}