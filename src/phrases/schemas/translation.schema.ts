import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Audio, AudioSchema } from './audio.schema';

@Schema({ _id: false })
export class Translation {
  @Prop({ required: true })
  language: string; // 'en', 'pt', etc.

  @Prop({ required: true, trim: true })
  translatedText: string;

  @Prop({ default: '/default/image.png' })
  imageUrl: string;

  @Prop({ type: [AudioSchema], default: [] }) // Array de sub-documentos Audio
  audios: Audio[];
}

export const TranslationSchema = SchemaFactory.createForClass(Translation);