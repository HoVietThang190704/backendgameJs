import { CreateUserDto } from "../dto/user.dto";
import { User } from "../model/user";
import { IUserRepository } from "../repository/user.repository.interface";

export class UserService implements IUserRepository {
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
  
}