import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false }) // _id: false porque no necesita su propio ID
export class Audio {
  @Prop({ required: true })
  gender: string; // 'femenino', 'masculino'

  @Prop({ required: true })
  audioUrl: string;
}

export const AudioSchema = SchemaFactory.createForClass(Audio);