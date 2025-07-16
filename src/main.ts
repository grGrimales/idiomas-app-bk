import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // cros
 // --- CONFIGURACIÓN DE CORS MEJORADA ---
  const whitelist = [
    'http://localhost:4200', // Para desarrollo local
    'https://idiomas-app-fe.vercel.app', // Tu dominio de producción
    'https://idiomas-app.vercel.app'
  ];

  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        // Si el origen está en la lista blanca (o no hay origen, como en Postman), permite la petición
        callback(null, true);
      } else {
        // Si no, rechaza la petición
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Permite que se envíen cookies y headers de autorización
  });
  // ------------------------------------

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
