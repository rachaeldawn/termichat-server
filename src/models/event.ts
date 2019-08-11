import { IsString } from 'class-validator';

export abstract class Event<T = any> {

  public data: T;

  @IsString()
  public event: string;
}
