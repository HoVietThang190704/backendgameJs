import { CreateUserDto } from "../dto/user.dto";
import { User } from "../model/user";
import { IUserRepository } from "../repository/user.repository.interface";
import { IUserService } from "./user.service.interface";

export class UserService implements IUserService {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(user: CreateUserDto): Promise<User> {
    return await this.userRepository.createUser(user);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.getUserByEmail(email);
  }

  async getUserById(id: string, projection?: string): Promise<User | null> {
    return await this.userRepository.getUserById(id, projection);
  }

  async setCurrentMatch(userId: string, matchId: string | null): Promise<void> {
    await this.userRepository.setCurrentMatch(userId, matchId);
  }
}