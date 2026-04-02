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

  async applyGameResult(userId: string, rankDelta: number, isWin: boolean): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      return;
    }

    const nextWins = (user.wins ?? 0) + (isWin ? 1 : 0);
    const nextLosses = (user.losses ?? 0) + (isWin ? 0 : 1);
    const nextTotalMatches = nextWins + nextLosses;
    const nextWinRate = nextTotalMatches > 0 ? Number(((nextWins / nextTotalMatches) * 100).toFixed(1)) : 0;
    const nextRank = Math.max(0, (user.rank ?? 1000) + rankDelta);

    user.wins = nextWins;
    user.losses = nextLosses;
    user.totalMatches = nextTotalMatches;
    user.winRate = nextWinRate;
    user.rank = nextRank;
    user.modified = { time: new Date() };

    await user.save();
  }

  async getTopUsers(limit: number): Promise<User[]> {
    return await UserModel.find({}, { email: 0, password: 0 }).sort({ rank: -1 }).limit(limit).lean();
  }

  async countUsersWithHigherRank(rank: number): Promise<number> {
    return await UserModel.countDocuments({ rank: { $gt: rank } });
  }

  async searchUsersByName(name: string, limit: number = 20): Promise<User[]> {
    const query = {
      $or: [
        { name: { $regex: name, $options: 'i' } },
        { username: { $regex: name, $options: 'i' } },
      ],
    };
    return await UserModel.find(query, { email: 0, password: 0 }).limit(limit).lean();
  }
}