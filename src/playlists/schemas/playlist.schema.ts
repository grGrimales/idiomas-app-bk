import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Phrase } from '../../phrases/schemas/phrase.schema';

@Schema({ timestamps: true })
export class Playlist extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: false })
  isDefault: boolean;

  // Referencia al dueño del playlist
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  // Array de referencias a las frases
   @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Phrase' }])
  phrases: Types.ObjectId[];


    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  sharedWith: User[];

}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist);