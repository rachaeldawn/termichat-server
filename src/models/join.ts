import { IsString } from 'class-validator';
import { Event } from './event';

export class StringEvent extends Event<string> {
  @IsString()
  public data: string;
}
