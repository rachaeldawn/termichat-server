import { IsString } from 'class-validator';
import { Event } from './event';

export class ChatEvent extends Event<string> {
  @IsString()
  public channel: string;
  @IsString()
  public sender: string;
}
