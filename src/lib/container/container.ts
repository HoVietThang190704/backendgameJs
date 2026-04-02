import { AuthController } from '../../controllers/auth.controller';
import { MatchController } from '../../controllers/match.controller';
import { WaitingQueueController } from '../../controllers/waitingQueue.controller';
import { FriendController } from '../../controllers/friend.controller';
import { UserController } from '../../controllers/user.controller';
import SocketService from '../../socket/socket.service';
import { MatchRepository } from '../../repository/match.repository.impl';
import { UserRepository } from '../../repository/user.repository.impl';
import { FriendRepository } from '../../repository/friend.repository.impl';
import { IMatchRepository } from '../../repository/match.repository.interface';
import { IUserRepository } from '../../repository/user.repository.interface';
import { IFriendRepository } from '../../repository/friend.repository.interface';
import { MatchService } from '../../service/match.service.impl';
import { MatchStateService } from '../../service/match-state.service.impl';
import { MatchHistoryService } from '../../service/match-history.service.impl';
import { UserService } from '../../service/user.service.impl';
import { FriendService } from '../../service/friend.service.impl';
import { AuthService } from '../../service/auth.service.impl';
import { IMatchService } from '../../service/match.service.interface';
import { IFriendService } from '../../service/friend.service.interface';
import { IMatchStateService } from '../../service/match-state.service.interface';
import { IMatchHistoryService } from '../../service/match-history.service.interface';
import { IUserService } from '../../service/user.service.interface';
import { IAuthService } from '../../service/auth.service.interface';
import { WaitingQueueRepository } from '../../repository/waitingQueue.repository.impl';
import { IWaitingQueueRepository } from '../../repository/waitingQueue.repository.interface';
import { WaitingQueueService } from '../../service/waitingQueue.service.impl';
import { IWaitingQueueService } from '../../service/waitingQueue.service.interface';

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

    const waitingQueueRepository: IWaitingQueueRepository = new WaitingQueueRepository();
    this.services.set('WaitingQueueRepository', waitingQueueRepository);

    const friendRepository: IFriendRepository = new FriendRepository();
    this.services.set('FriendRepository', friendRepository);

    // Register services
    const userService: IUserService = new UserService(userRepository);
    this.services.set('UserService', userService);

    const matchService: IMatchService = new MatchService(matchRepository, userService);
    this.services.set('MatchService', matchService);

    const matchStateService: IMatchStateService = new MatchStateService(userService);
    this.services.set('MatchStateService', matchStateService);

    const matchHistoryService: IMatchHistoryService = new MatchHistoryService();
    this.services.set('MatchHistoryService', matchHistoryService);

    const authService: IAuthService = new AuthService(userService);
    this.services.set('AuthService', authService);

    const friendService: IFriendService = new FriendService(friendRepository);
    this.services.set('FriendService', friendService);

    const waitingQueueService: IWaitingQueueService = new WaitingQueueService(waitingQueueRepository, userService);
    this.services.set('WaitingQueueService', waitingQueueService);

    // Register controllers
    const authController = new AuthController(authService);
    this.services.set('AuthController', authController);

    const socketService = SocketService.getInstance();
    this.services.set('SocketService', socketService);

    const userControllerInstance = new UserController(userService);
    this.services.set('UserController', userControllerInstance);

    const matchController = new MatchController(matchService, socketService, matchStateService, matchHistoryService, userService);
    this.services.set('MatchController', matchController);

    const waitingQueueController = new WaitingQueueController(waitingQueueService);
    this.services.set('WaitingQueueController', waitingQueueController);

    const friendController = new FriendController(friendService);
    this.services.set('FriendController', friendController);
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