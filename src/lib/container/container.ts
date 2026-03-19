import { AuthController } from '../../controllers/auth.controller';
import { MatchController } from '../../controllers/match.controller';
import { UserController } from '../../controllers/user.controller';
import { MatchRepository } from '../../repository/match.repository.impl';
import { UserRepository } from '../../repository/user.repository.impl';
import { IMatchRepository } from '../../repository/match.repository.interface';
import { IUserRepository } from '../../repository/user.repository.interface';
import { MatchService } from '../../service/match.service.impl';
import { UserService } from '../../service/user.service.impl';
import { AuthService } from '../../service/auth.service.impl';
import { IMatchService } from '../../service/match.service.interface';
import { IUserService } from '../../service/user.service.interface';
import { IAuthService } from '../../service/auth.service.interface';

class Container {
  private static instance: Container;
  private services: Map<string, unknown> = new Map();

  private constructor() {
    this.registerDependencies();
  }

  private registerDependencies(): void {
    // Register repositories
    const userRepository: IUserRepository = new UserRepository();
    this.services.set('UserRepository', userRepository);

    const matchRepository: IMatchRepository = new MatchRepository();
    this.services.set('MatchRepository', matchRepository);

    // Register services
    const userService: IUserService = new UserService(userRepository);
    this.services.set('UserService', userService);

    const matchService: IMatchService = new MatchService(matchRepository, userService);
    this.services.set('MatchService', matchService);

    const authService: IAuthService = new AuthService(userService);
    this.services.set('AuthService', authService);

    // Register controllers
    const authController = new AuthController(authService);
    this.services.set('AuthController', authController);

    const userControllerInstance = new UserController(userService);
    this.services.set('UserController', userControllerInstance);

    const matchController = new MatchController(matchService);
    this.services.set('MatchController', matchController);
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found in container`);
    }
    return service as T;
  }
}

export default Container;