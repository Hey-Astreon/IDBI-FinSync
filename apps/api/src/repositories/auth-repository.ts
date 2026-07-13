import { prisma } from '../config/prisma';
import {
  Session,
  RefreshToken,
  OtpVerification,
  DeviceSession,
  OtpStatus,
  Prisma,
} from '@prisma/client';

export interface IAuthRepository {
  createSession(data: Prisma.SessionUncheckedCreateInput): Promise<Session>;
  findSessionByToken(token: string): Promise<Session | null>;
  deleteSession(token: string): Promise<void>;
  createRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken>;
  findRefreshToken(token: string): Promise<RefreshToken | null>;
  deleteRefreshToken(token: string): Promise<void>;
  createOtp(data: Prisma.OtpVerificationUncheckedCreateInput): Promise<OtpVerification>;
  findOtp(userId: string, codeHash: string, purpose: string): Promise<OtpVerification | null>;
  updateOtpStatus(id: string, status: OtpStatus): Promise<OtpVerification>;
  createDeviceSession(data: Prisma.DeviceSessionUncheckedCreateInput): Promise<DeviceSession>;
  findDeviceSession(userId: string, deviceId: string): Promise<DeviceSession | null>;
  updateDeviceSessionTrust(id: string, isTrusted: boolean): Promise<DeviceSession>;
}

export class AuthRepository implements IAuthRepository {
  async createSession(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
    return prisma.session.create({
      data,
    });
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { token },
    });
  }

  async deleteSession(token: string): Promise<void> {
    await prisma.session.delete({
      where: { token },
    });
  }

  async createRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({
      where: { token },
    });
  }

  async createOtp(data: Prisma.OtpVerificationUncheckedCreateInput): Promise<OtpVerification> {
    return prisma.otpVerification.create({
      data,
    });
  }

  async findOtp(
    userId: string,
    codeHash: string,
    purpose: string,
  ): Promise<OtpVerification | null> {
    return prisma.otpVerification.findFirst({
      where: {
        userId,
        codeHash,
        purpose,
        expiresAt: {
          gt: new Date(),
        },
        status: 'PENDING',
      },
    });
  }

  async updateOtpStatus(id: string, status: OtpStatus): Promise<OtpVerification> {
    return prisma.otpVerification.update({
      where: { id },
      data: { status },
    });
  }

  async createDeviceSession(
    data: Prisma.DeviceSessionUncheckedCreateInput,
  ): Promise<DeviceSession> {
    return prisma.deviceSession.create({
      data,
    });
  }

  async findDeviceSession(userId: string, deviceId: string): Promise<DeviceSession | null> {
    return prisma.deviceSession.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });
  }

  async updateDeviceSessionTrust(id: string, isTrusted: boolean): Promise<DeviceSession> {
    return prisma.deviceSession.update({
      where: { id },
      data: { isTrusted },
    });
  }
}
