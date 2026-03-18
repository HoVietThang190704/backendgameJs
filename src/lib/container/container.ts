import { UserRepository } from "../../repository/user.repository.impl";
import { UserService } from "../../service/user.service.impl";
import { UserController } from "../../controllers/user.controller";

class Container {
    private static instance: Container;
    private service: Map<string, unknown> = new Map();

    private constructor() {
        this.registerDependencies();
    }

    private registerDependencies(): void {
        // repository
        const userRepo = new UserRepository();
        this.service.set("UserRepository", userRepo);

        // service
        const userService = new UserService(userRepo);
        this.service.set("UserService", userService);

        // controller
        const userController = new UserController(userService);
        this.service.set("UserController", userController);
    }

    public static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    public get<T>(name: string): T {
        return this.service.get(name) as T;
    }
}

export default Container;