import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Phrase } from './phrase.schema';

@Schema({ timestamps: true })
export class UserPhraseStats extends Document {
  // Referencia al usuario
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  // Referencia a la frase
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Phrase', required: true })
  phrase: Phrase;

  @Prop({ default: 0 })
  relaxListenCount: number;

  @Prop({ default: 0 })
  deepStudyCount: number;

  @Prop({ default: 0 })
  evalSuccessCount: number;

  @Prop({ default: 0 })
  evalFailCount: number;
}

export const UserPhraseStatsSchema = SchemaFactory.createForClass(UserPhraseStats);

// Índice compuesto para asegurar que solo haya un documento de estadísticas por usuario y por frase.
UserPhraseStatsSchema.index({ user: 1, phrase: 1 }, { unique: true });