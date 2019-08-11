import { IsString } from 'class-validator';
import { Event } from './event';

export class RenameEvent extends Event<string> {
  /** the channel we are targeting */
  @IsString()
  public data: string;

  @IsString()
  public newName: string;
}
