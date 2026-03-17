import { Request, Response } from 'express';
import { IUserService } from '../service/user.service.interface';
import { BaseResponse } from '../lib/baseresponse';
import { User } from '../model/user';

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

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
      } else {
        const fieldsQuery = req.query.fields as string;
        let projection = '';

        if (fieldsQuery) {
          projection = fieldsQuery
            .split(',')
            .map(f => f.trim())
            .filter(f => f !== 'password' && f !== '-password' && f !== 'passwordHash' && f !== '-passwordHash')
            .join(' ');
        }

        const user = await this.userService.getUserById(userId, projection);

        if (!user) {
          res.status(404).json({ message: "User not found" });
        } else {
          const response = new BaseResponse<User>()
            .setResponse(200)
            .setMessage("User profile retrieved successfully")
            .setSuccess(true)
            .setData(user)
            .build();

          res.status(200).json(response);
        }
      }
    } catch (error) {
      console.error("Error retrieving user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
