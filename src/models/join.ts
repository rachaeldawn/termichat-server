import { IsString } from 'class-validator';
import { Event } from './event';

export class JoinEvent extends Event<string> {
  @IsString()
  public data: string;
}
