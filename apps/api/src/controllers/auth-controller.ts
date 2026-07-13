import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth-service';
import { RegisterDTO, LoginDTO, RequestOtpDTO, VerifyOtpDTO } from '../schemas/auth-schemas';
import { env } from '../config/env';
import { AuthenticationError } from '../errors/app-errors';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const { email, mobileNumber, password } = request.body as RegisterDTO;
    const user = await this.authService.register(email, mobileNumber, password);
    return reply.status(201).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: user,
    });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password, deviceId, deviceName, ipAddress } = request.body as LoginDTO;
    const session = await this.authService.login(email, password, deviceId, deviceName, ipAddress);

    // Save refresh token in HttpOnly Cookie
    reply.setCookie('refreshToken', session.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        user: session.user,
        token: session.token,
      },
    });
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const tokenValue = request.cookies.refreshToken;
    if (!tokenValue) {
      throw new AuthenticationError('Refresh token is missing.');
    }

    const session = await this.authService.refresh(tokenValue);

    // Set rotated refresh token back in HttpOnly Cookie
    reply.setCookie('refreshToken', session.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        token: session.token,
      },
    });
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const tokenValue = request.cookies.refreshToken;
    if (tokenValue) {
      await this.authService.logout(tokenValue);
    }
    reply.clearCookie('refreshToken', { path: '/' });
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: { message: 'Logged out successfully.' },
    });
  }

  async requestOtp(request: FastifyRequest, reply: FastifyReply) {
    const { userId, purpose } = request.body as RequestOtpDTO;
    const code = await this.authService.requestOtp(userId, purpose);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'OTP generated successfully.',
        ...(env.NODE_ENV !== 'production' && { code }),
      },
    });
  }

  async verifyOtp(request: FastifyRequest, reply: FastifyReply) {
    const { userId, code, purpose } = request.body as VerifyOtpDTO;
    const isValid = await this.authService.verifyOtp(userId, code, purpose);
    return reply.status(200).send({
      success: true,
      timestamp: new Date().toISOString(),
      data: { isValid },
    });
  }
}
