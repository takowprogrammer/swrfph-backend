import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AppRole } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required || required.length === 0) return true;

        const req = context.switchToHttp().getRequest();
        const user = req.user as { userId: string; email: string; role?: AppRole } | undefined;

        console.log('RolesGuard Debug:', {
            required,
            userRole: user?.role,
            userExists: !!user,
            hasRole: !!user?.role
        });

        if (!user || !user.role) return false;

        return required.includes(user.role);
    }
}
