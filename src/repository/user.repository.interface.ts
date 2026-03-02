import { IUserDocument } from "../model/user";

export interface IUserRepository {
    /**
     * Create a new user record.
     * @param username
     * @param email
     * @param password - hashed password
     */
    create(username: string, email: string, password: string, role?: string): Promise<IUserDocument>;

    /**
     * Find a user by email address.
     */
    findByEmail(email: string): Promise<IUserDocument | null>;

    /**
     * Lookup user by id.
     */
    findById(id: string): Promise<IUserDocument | null>;
}