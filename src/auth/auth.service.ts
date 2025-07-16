// src/auth/auth.service.ts
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerAuthDto: RegisterAuthDto) {
    const { email, password } = registerAuthDto;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

   const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);


 const newUser = new this.userModel({ email, password: hashedPassword });
    
    await newUser.save();

    return { message: 'Usuario registrado exitosamente' };
  }

async login(loginAuthDto: LoginAuthDto) {
  const { email, password } = loginAuthDto;

  // 1. Buscamos al usuario y nos aseguramos de traer el password
  const user = await this.userModel.findOne({ email }).select('+password');

  // 2. Verificamos que el usuario exista Y que tenga una contraseña guardada
  if (!user || !user.password) {
    throw new UnauthorizedException('Credenciales inválidas');
  }

  // 3. Comparamos las contraseñas
  const isPasswordMatching = await bcrypt.compare(password, user.password);

  if (!isPasswordMatching) {
    throw new UnauthorizedException('Credenciales inválidas');
  }

  // 4. Si todo está bien, generamos el token
  const payload = { id: user._id, email: user.email };
  const token = this.jwtService.sign(payload);

  return { access_token: token };
}

  async renewToken(user: any) {
    // En Mongoose, el id se encuentra en user._id
    const payload = { id: user._id, email: user.email };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }
}