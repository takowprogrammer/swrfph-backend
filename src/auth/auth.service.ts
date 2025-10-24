import { Injectable, UnauthorizedException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AppRole } from './roles.decorator';
import { User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        @Inject(forwardRef(() => AuditService))
        private auditService: AuditService,
    ) { }

    async validateUser(email: string, pass: string, ipAddress?: string, userAgent?: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user && (await argon2.verify(user.password, pass))) {
            const { password, ...result } = user as any;
            return result;
        } else {
            // Log failed login attempt
            await this.auditService.logFailedLogin(email, ipAddress, userAgent);
        }
        return null;
    }

    async login(user: any, ipAddress?: string, userAgent?: string) {
        const payload = { email: user.email, sub: user.id, role: (user.role || 'PROVIDER') as AppRole };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Store refresh token in database
        await this.usersService.updateRefreshToken(user.id, refreshToken);

        // Log successful login
        await this.auditService.logUserLogin(user.id, ipAddress, userAgent);

        // Create login session
        const sessionId = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await this.auditService.createLoginSession({
            userId: user.id,
            sessionId,
            ipAddress,
            userAgent,
            expiresAt,
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.usersService.findOne(payload.email);

            if (!user || user.refreshToken !== refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const newPayload = { email: user.email, sub: user.id, role: user.role as AppRole };
            const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });

            return {
                access_token: newAccessToken,
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findOne(email);
        if (!user) {
            // Don't reveal if user exists
            return { message: 'If the email exists, a reset link has been sent.' };
        }

        const resetToken = randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await this.usersService.updateResetToken(user.id, resetToken, resetExpires);

        // In a real app, send email here
        console.log(`Reset token for ${email}: ${resetToken}`);

        return { message: 'If the email exists, a reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.usersService.findByResetToken(token);

        if (!user || !user.resetExpires || user.resetExpires < new Date()) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        const hashedPassword = await argon2.hash(newPassword);
        await this.usersService.updatePassword(user.id, hashedPassword);
        await this.usersService.clearResetToken(user.id);

        return { message: 'Password has been reset successfully' };
    }

    async logout(userId: string, ipAddress?: string, userAgent?: string) {
        await this.usersService.updateRefreshToken(userId, null);

        // Log logout
        await this.auditService.logUserLogout(userId, ipAddress, userAgent);

        // Terminate all user sessions
        await this.auditService.terminateAllUserSessions(userId);

        return { message: 'Logged out successfully' };
    }
}
