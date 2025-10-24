import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalAuthGuard } from './local-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService
    ) { }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto, @Request() req: any) {
        const user = await this.usersService.create(createUserDto);
        return this.authService.login(user, req.ip, req.headers['user-agent']);
    }

    @Post('register-admin')
    async registerAdmin(@Body() createUserDto: CreateUserDto, @Request() req: any) {
        const user = await this.usersService.createWithRole(createUserDto, 'ADMIN');
        return this.authService.login(user, req.ip, req.headers['user-agent']);
    }

    @Post('register-provider')
    async registerProvider(@Body() createUserDto: CreateUserDto, @Request() req: any) {
        const user = await this.usersService.createWithRole(createUserDto, 'PROVIDER');
        return this.authService.login(user, req.ip, req.headers['user-agent']);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req: any) {
        return this.authService.login(req.user, req.ip, req.headers['user-agent']);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req: any) {
        // Return only the necessary user fields to avoid circular reference issues
        const { userId, email, role } = req.user;
        return {
            id: userId,
            email,
            role,
        };
    }

    @Post('refresh')
    async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    @Post('forgot-password')
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @Post('reset-password')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Request() req: any) {
        return this.authService.logout(req.user.userId, req.ip, req.headers['user-agent']);
    }
}
