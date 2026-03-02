export interface IUserService {
    register(username: string, email: string, password: string): Promise<any>;
    /**
     * Authenticate credentials and return tokens
     */
    login(email: string, password: string): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;

    getProfile(id: string): Promise<any>;

    /**
     * Exchange a valid refresh token for a fresh access token.
     */
    refresh(refreshToken: string): Promise<{ accessToken: string }>;
}