import { MatchDocument, MatchInput, MatchModel } from "../model/match";
import { IMatchRepository } from "./match.repository.interface";
import { Types } from "mongoose";

export class MatchRepository implements IMatchRepository {
  constructor() {}

  async createMatch(match: MatchInput): Promise<MatchDocument> {
    const createdMatch = await MatchModel.create(match);
    return createdMatch;
  }

  async findMatchById(matchId: string): Promise<MatchDocument | null> {
    const objectId = Types.ObjectId.isValid(matchId) ? new Types.ObjectId(matchId) : matchId;
    return await MatchModel.findById(objectId);
  }

  async findActiveMatchByUserId(userId: string): Promise<MatchDocument | null> {
    const objectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
    return await MatchModel.findOne({
      $and: [
        { status: { $in: ["waiting", "playing"] } },
        { "players.userId": objectId },
      ],
    });
  }

  async findMatchByPinCode(pinCode: string): Promise<MatchDocument | null> {
    return await MatchModel.findOne({ pinCode });
  }

  async updateMatch(matchId: string, update: Partial<MatchInput>): Promise<MatchDocument | null> {
    const objectId = Types.ObjectId.isValid(matchId) ? new Types.ObjectId(matchId) : matchId;
    return await MatchModel.findByIdAndUpdate(objectId, update, { new: true });
  }

  async deleteMatch(matchId: string): Promise<MatchDocument | null> {
    const objectId = Types.ObjectId.isValid(matchId) ? new Types.ObjectId(matchId) : matchId;
    return await MatchModel.findByIdAndDelete(objectId);
  }
}
