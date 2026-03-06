import { Request, Response } from 'express';
import { IUserService } from "../service/user.service.interface";

export class UserController {
  private readonly userService: IUserService;

  constructor(userService: IUserService) {
    this.userService = userService;
  }

  async getUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const email = req.params.email;
      const user = await this.userService.getUserByEmail(email as string);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.status(200).json(user);
      }
    } catch (error) {
      res.status(400).json({ message: "Error fetching user: "});
    }
  }
}
