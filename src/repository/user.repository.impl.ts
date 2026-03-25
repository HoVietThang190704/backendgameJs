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

  async getUserById(id: string, projection?: string): Promise<User | null> {
    const finalProjection = projection ? projection : { password: 0 };
    return await UserModel.findOne({_id: id}, finalProjection);
  }

  async setCurrentMatch(userId: string, matchId: string | null): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { currentMatchId: matchId });
  }

  async getTopUsers(limit: number): Promise<User[]> {
    return await UserModel.find({}, { email: 0, password: 0 }).sort({ rank: -1 }).limit(limit).lean();
  }

  async countUsersWithHigherRank(rank: number): Promise<number> {
    return await UserModel.countDocuments({ rank: { $gt: rank } });
  }
}