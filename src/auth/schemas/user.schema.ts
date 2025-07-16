import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) // timestamps: true añade createdAt y updatedAt
export class User extends Document {
  @Prop({
    unique: true,
    required: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  password?: string;

  @Prop()
  fullName?: string;

  @Prop({
    default: 'es',
  })
  nativeLanguage: string;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);