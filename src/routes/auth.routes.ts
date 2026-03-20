import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

export function createAuthRoutes(authController: AuthController): Router {
    const router = Router();

    /**
     * @openapi
     * /api/auth/register:
     *   post:
     *     summary: Register a new user
     *     tags:
     *       - Auth
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [username, email, password]
     *             properties:
     *               username:
     *                 type: string
     *                 example: player1
     *               email:
     *                 type: string
     *                 format: email
     *                 example: player1@example.com
     *               password:
     *                 type: string
     *                 format: password
     *                 example: pass1234
     *               name:
     *                 type: string
     *               rule:
     *                 type: string
     *               avatar_url:
     *                 type: string
     *                 format: uri
     *     responses:
     *       201:
     *         description: User registered successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BaseResponse'
     *       400:
     *         description: Validation error or email already exists
     */
    router.post('/register', (req, res) => authController.register(req, res));

    /**
     * @openapi
     * /api/auth/login:
     *   post:
     *     summary: Login and obtain access/refresh tokens
     *     tags:
     *       - Auth
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, password]
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *                 format: password
     *     responses:
     *       200:
     *         description: Logged in
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BaseResponse'
     *       401:
     *         description: Invalid credentials
     */
    router.post('/login', (req, res) => authController.login(req, res));

    /**
     * @openapi
     * /api/auth/refresh:
     *   post:
     *     summary: Refresh access token using refresh token
     *     tags:
     *       - Auth
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [refreshToken]
     *             properties:
     *               refreshToken:
     *                 type: string
     *     responses:
     *       200:
     *         description: Refresh successful
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BaseResponse'
     *       401:
     *         description: Invalid/expired refresh token
     */
    router.post('/refresh', (req, res) => authController.refreshToken(req, res));

    /**
     * @openapi
     * /api/auth/logout:
     *   post:
     *     summary: Logout and invalidate refresh token
     *     tags:
     *       - Auth
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [refreshToken]
     *             properties:
     *               refreshToken:
     *                 type: string
     *     responses:
     *       200:
     *         description: Logout successful
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BaseResponse'
     *       401:
     *         description: Invalid refresh token
     */
    router.post('/logout', (req, res) => authController.logout(req, res));
    return router;
}