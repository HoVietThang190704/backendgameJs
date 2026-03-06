import { AuthController } from '../../controllers/auth.controller';
import { UserRepository } from '../../repository/user.repository.impl';
import { IUserRepository } from '../../repository/user.repository.interface';
import { UserService } from '../../service/user.service.impl';
import { AuthService } from '../../service/auth.service.impl';
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

    // Register services
    const userService: IUserService = new UserService(userRepository);
    this.services.set('UserService', userService);
    const authService: IAuthService = new AuthService(userService);
    this.services.set('AuthService', authService);

    // Register controllers
    const userController = new AuthController(authService);
    this.services.set('AuthController', userController);
    const authController = new AuthController(authService);
    this.services.set('AuthController', authController);
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