import { IsNull } from "typeorm";
import { AppDataSource } from "../db";
import { User } from '../entities/User';
import type { LoginModel } from "../models/login.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from 'express';
import type { RegisterModel } from "../models/register.model";

const repo = AppDataSource.getRepository(User);
const tokenSecret = process.env.JWT_SECRET as string;
const accessTTL = process.env.JWT_ACCESS_TIME_TO_LIVE || '15m';
const refreshTTL = process.env.JWT_REFRESH_TIME_TO_LIVE || '7d';

export class UserService {
    static async login(model: LoginModel) {
        console.log('Attempting login for email:', model.email);

        const user = await this.getUserByEmail(model.email);

        if (!user) {
            console.error('User not found for email:', model.email);
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(model.password, user.password!);
        if (!isPasswordValid) {
            console.error('Invalid password for email:', model.email);
            throw new Error('Invalid email or password');
        }

        const payload = {
            id: user.userId,
            email: user.email,
        };
        // @ts-ignore
        const access = jwt.sign(payload, tokenSecret, { expiresIn: accessTTL });
        // @ts-ignore
        const newRefresh = jwt.sign(payload, tokenSecret, { expiresIn: refreshTTL }); // Generate a new refresh token here!

        user.refreshToken = newRefresh; // Save the NEW refresh token
        await repo.save(user);

        console.log('Login successful for email:', model.email);

        return {
            name: user.email,
            access,
            refresh: newRefresh, // Return the NEW refresh token
        };
    }

    static async logout(userId: number) {
        const user = await repo.findOneBy({ userId });

        if (!user) {
            throw new Error('User not found');
        }

        // Remove the refresh token from the database
        user.refreshToken = null;
        await repo.save(user);
        console.log(`User ${userId} successfully logged out and refresh token removed.`);
    }

    static async verifyToken(req: any, res: Response, next: NextFunction) {
        const whitelistPatterns = [
            /^\/api\/user\/login$/,
            /^\/api\/user\/signup$/,
            /^\/api\/user\/refresh$/, 
            /^\/api\/user\/register$/,
            /^\/api\/vehicles\/\d+\/reviews$/,
            /^\/api\/vehicles\/\d+$/,
            /^\/api\/vehicles$/,
            /^\/api\/reviews\/vehicle\/\d+$/
        ];

        const path = req.path || req.url;

        const isWhitelisted = whitelistPatterns.some(pattern => pattern.test(path));

        if (isWhitelisted) {
            next();
            return;
        }

        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({
                message: 'NO_TOKEN_FOUND',
                timestamp: new Date(),
            });
            return;
        }

        jwt.verify(token, tokenSecret, (err: any, user: any) => {
            if (err) {
                console.error(`JWT Verification Failed for path ${path}: ${err.message}`); 
                res.status(403).json({
                    message: 'INVALID_TOKEN',
                    timestamp: new Date(),
                    errorDetails: err.message 
                });
                return;
            }

            req.user = user;
            next();
        });
    }

    static async refreshToken(token: string) {
        try {
            console.log('Attempting to refresh token...'); // Updated log for clarity
            console.log('Received refresh token:', token.substring(0, 10) + '...'); // Log a snippet

            const decoded: any = jwt.verify(token, tokenSecret); // Verify the provided refresh token
            console.log('Refresh token decoded:', decoded.email);

            const user = await this.getUserByEmail(decoded.email);

            if (!user) {
                console.error('User not found for refresh token email:', decoded.email);
                throw new Error('INVALID_REFRESH_TOKEN: User not found');
            }
            
            // Critical check: Does the provided refresh token match the one in the DB for this user?
            if (user.refreshToken !== token) {
                console.error('Provided refresh token does not match stored token for user:', user.email);
                throw new Error('INVALID_REFRESH_TOKEN: Token mismatch or already used');
            }
            
            // If the refresh token matches and is valid, generate NEW tokens
            const payload = {
                id: user.userId,
                email: user.email,
            };
// @ts-ignore
            const newAccess = jwt.sign(payload, tokenSecret, { expiresIn: accessTTL });
            // @ts-ignore
            const newRefresh = jwt.sign(payload, tokenSecret, { expiresIn: refreshTTL }); // <--- GENERATE NEW REFRESH TOKEN

            // Update the user's refresh token in the database with the new one
            user.refreshToken = newRefresh;
            await repo.save(user); // Save the new refresh token

            console.log('Tokens successfully refreshed. New access token generated.');
            return {
                name: user.email,
                access: newAccess, // Return the NEW access token
                refresh: newRefresh, // Return the NEW refresh token
            };

        } catch (error: any) {
            console.error('Error during token refresh process:'); // General error log
            if (error.name === 'TokenExpiredError') {
                console.error('  -> Reason: Refresh token expired.', error.message);
                throw new Error('REFRESH_TOKEN_EXPIRED');
            } else if (error.name === 'JsonWebTokenError') {
                console.error('  -> Reason: JWT malformed or invalid signature.', error.message);
                throw new Error('INVALID_REFRESH_TOKEN_FORMAT');
            }
            console.error('  -> Generic Refresh Failure:', error.message);
            throw new Error('REFRESH_FAILED');
        }
    }


  static async register(model: RegisterModel) {
    const data = await repo.existsBy({
      email: model.email,
      deletedAt: IsNull(),
    });
  
    if (data) {
      throw new Error('USER_EXISTS');
    }
  
    const hashed = await bcrypt.hash(model.password, 12);
    const user = await repo.save({
      email: model.email,
      password: hashed,
      phone: model.phone,
    });
  
    return { userId: user.userId }; 
  }
  
  static async getUserByEmail(email: string) {
    console.log(`Searching for user with email: ${email}`);

    const user = await repo.findOne({
      where: {
        email,
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      console.error(`User not found for email: ${email}`); 
      throw new Error('User not found');
    }

    console.log(`User found: ${user.email}`); 
    return user;
  }
}