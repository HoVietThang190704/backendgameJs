import { CreateUserDto } from "../dto/user.dto";
import { User, UserModel } from "../model/user";
import { IUserRepository } from "./user.repository.interface";

export class UserRepository implements IUserRepository {
  constructor() {}

  async createUser(user: CreateUserDto): Promise<User> {
    const createdUser = await UserModel.create(user);
    return createdUser;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await UserModel.findOne({email});
  }

}