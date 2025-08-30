import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Translation, TranslationSchema } from './translation.schema';
import { Level } from 'src/common/enums/level.enum';


@Schema({ timestamps: true })
export class Phrase extends Document {
  @Prop({
    required: true,
    trim: true,
  })
  originalText: string;

  @Prop({
    type: String, // Guardamos el enum como String
    enum: Level,
    default: Level.BASIC,
  })
  level: Level;

  // Referencia al usuario creador
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  @Prop({ type: [TranslationSchema], required: true }) // Array de sub-documentos Translation
  translations: Translation[];

  @Prop({ type: String, required: false }) // <-- AÑADE ESTA LÍNEA
  originAudioUrl?: string;


  @Prop({ type: Number, required: true })
  groupId: number;
  





}

export const PhraseSchema = SchemaFactory.createForClass(Phrase);