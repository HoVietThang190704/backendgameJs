import z from "zod";
import { createUserDto } from "./user.dto";

export const LoginDto = createUserDto.pick({
	email: true,
	password: true
});
export type LoginDto = z.infer<typeof LoginDto>;

export const RefreshTokenDto = z.object({
	refreshToken: z.string().min(1)
});
export type RefreshTokenDto = z.infer<typeof RefreshTokenDto>;