import { Types } from "mongoose";
import { UserModel } from "../model/user";
import { IUserRepository } from "./user.repository.interface";

export class UserRepository implements IUserRepository {
    constructor() {}

    async create(username: string, email: string, password: string, role: string = "user") {
        const user = new UserModel({ username, email, password, role });
        return user.save();
    }

    async findByEmail(email: string) {
        return UserModel.findOne({ email }).exec();
    }

    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }
        return UserModel.findById(id).exec();
    }
}