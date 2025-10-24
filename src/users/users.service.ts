import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findOneById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const hashedPassword = await argon2.hash(createUserDto.password);
        return this.prisma.user.create({
            data: {
                ...createUserDto,
                password: hashedPassword,
            },
        });
    }

    async createWithRole(createUserDto: CreateUserDto, role: 'ADMIN' | 'PROVIDER'): Promise<User> {
        const hashedPassword = await argon2.hash(createUserDto.password);
        return this.prisma.user.create({
            data: {
                ...createUserDto,
                password: hashedPassword,
                role,
            },
        });
    }

    async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken },
        });
    }

    async updateResetToken(userId: string, resetToken: string, resetExpires: Date): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { resetToken, resetExpires },
        });
    }

    async findByResetToken(token: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { resetToken: token },
        });
    }

    async updatePassword(userId: string, hashedPassword: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }

    async clearResetToken(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { resetToken: null, resetExpires: null },
        });
    }

    async findAll(query: QueryUsersDto) {
        const { search, role, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const skip = (page - 1) * limit;

        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                ],
            }),
            ...(role && { role: role as UserRole }),
        };

        const orderBy = {
            [sortBy]: sortOrder,
        };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const updateData: any = { ...updateUserDto };

        if (updateUserDto.password) {
            updateData.password = await argon2.hash(updateUserDto.password);
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string): Promise<User> {
        return this.prisma.user.delete({ where: { id } });
    }

    async getUsersStats() {
        const [totalUsers, totalAdmins, totalProviders, recentUsers] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: 'ADMIN' } }),
            this.prisma.user.count({ where: { role: 'PROVIDER' } }),
            this.prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            }),
        ]);

        return {
            totalUsers,
            totalAdmins,
            totalProviders,
            recentUsers,
        };
    }
}
