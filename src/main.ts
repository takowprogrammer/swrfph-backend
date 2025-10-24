import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    logger.log('🚀 Starting SWRFPH Backend Server...');
    logger.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);

    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    logger.log('🔧 Configuring global pipes and middleware...');
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));

    logger.log('🛡️ Setting up security middleware...');
    app.use(helmet());

    logger.log('🌐 Configuring CORS...');
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
            'http://localhost:3002',
            'http://127.0.0.1:3002',
            'http://localhost:5000',
        ],
        credentials: true,
    });

    logger.log('📚 Setting up Swagger documentation...');
    const swaggerConfig = new DocumentBuilder()
        .setTitle('SWRFPH API')
        .setDescription('Healthcare platform API documentation')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

    const port = process.env.PORT || 5000;
    logger.log(`🚀 Server starting on port ${port}...`);

    await app.listen(port);

    logger.log(`✅ Server successfully started on port ${port}`);
    logger.log(`📖 API Documentation available at http://localhost:${port}/docs`);
    logger.log(`🔗 Health check available at http://localhost:${port}/health`);
}
bootstrap();
