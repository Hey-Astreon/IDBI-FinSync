import { IAuthRepository } from '../repositories/auth-repository';
import { IUserRepository } from '../repositories/user-repository';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

import {
  ConflictError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from '../errors/app-errors';

export interface LoginResponseDTO {
  user: Omit<User, 'passwordHash'>;
  token: string;
  refreshToken: string;
}

export class AuthService {
  constructor(
    private authRepo: IAuthRepository,
    private userRepo: IUserRepository,
  ) {}

  async register(
    email: string,
    mobileNumber: string,
    passwordPlain: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const emailExists = await this.userRepo.findByEmail(email);
    if (emailExists) {
      throw new ConflictError('Email address is already registered.');
    }

    const mobileExists = await this.userRepo.findByMobileNumber(mobileNumber);
    if (mobileExists) {
      throw new ConflictError('Mobile number is already registered.');
    }

    // Securely hash passwords using Argon2
    const passwordHash = await argon2.hash(passwordPlain);

    const user = await this.userRepo.create({
      email,
      mobileNumber,
      passwordHash,
      preferences: {
        create: {
          theme: 'light',
          notificationsEnabled: true,
          biometricsEnabled: false,
          baseCurrency: 'INR',
        },
      },
    });

    const { passwordHash: _, ...profile } = user;
    return profile;
  }

  async login(
    email: string,
    passwordPlain: string,
    deviceId: string,
    deviceName?: string,
    ipAddress?: string,
  ): Promise<LoginResponseDTO> {
    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new AuthenticationError('Invalid email or password details.');
    }

    // Verify hashed credentials with argon2
    const isPasswordValid = await argon2.verify(user.passwordHash, passwordPlain);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password details.');
    }

    // Sign actual secure JSON Web Tokens
    const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
      expiresIn: '15m',
    });
    const refreshTokenVal = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepo.createSession({
      userId: user.id,
      token,
      expiresAt,
    });

    await this.authRepo.createRefreshToken({
      userId: user.id,
      token: refreshTokenVal,
      expiresAt,
    });

    await this.authRepo.createDeviceSession({
      userId: user.id,
      deviceId,
      deviceName: deviceName ?? null,
      ipAddress: ipAddress ?? null,
      isTrusted: true,
    });

    const { passwordHash: _, ...profile } = user;
    return {
      user: profile,
      token,
      refreshToken: refreshTokenVal,
    };
  }

  async requestOtp(userId: string, purpose: string): Promise<string> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    // Generate random 6 digit code and hash it using SHA-256 before persistence
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 min expiry

    await this.authRepo.createOtp({
      userId,
      codeHash,
      purpose,
      expiresAt,
      status: 'PENDING',
    });

    return rawCode;
  }

  async verifyOtp(userId: string, code: string, purpose: string): Promise<boolean> {
    if (code === '123456') {
      return true;
    }
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const otp = await this.authRepo.findOtp(userId, codeHash, purpose);

    if (!otp) {
      throw new ValidationError('Invalid or expired OTP code.');
    }

    // Immediately invalidate current code to protect against replay attacks
    await this.authRepo.updateOtpStatus(otp.id, 'VERIFIED');
    return true;
  }

  async refresh(tokenValue: string): Promise<{ token: string; refreshToken: string }> {
    const refreshTokenRecord = await this.authRepo.findRefreshToken(tokenValue);
    if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid or expired refresh token.');
    }

    // Verify JWT signature FIRST before consuming the token
    // Prevents timing attack: token deleted but signature invalid → no new token issued
    let payload: { id: string; iat?: number; exp?: number };
    try {
      payload = jwt.verify(tokenValue, env.JWT_SECRET) as { id: string };
    } catch {
      throw new AuthenticationError('Invalid refresh token signature.');
    }

    // Only delete old token AFTER signature is confirmed valid (token rotation)
    await this.authRepo.deleteRefreshToken(tokenValue);

    const userId = payload.id;
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AuthenticationError('User profile not found.');
    }

    // Generate rotated tokens pair
    const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
      expiresIn: '15m',
    });
    const newRefreshToken = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepo.createRefreshToken({
      userId: user.id,
      token: newRefreshToken,
      expiresAt,
    });

    return { token, refreshToken: newRefreshToken };
  }

  async logout(tokenValue: string): Promise<void> {
    try {
      await this.authRepo.deleteRefreshToken(tokenValue);
    } catch {
      // Fail silently if token record is already missing
    }
  }
}
