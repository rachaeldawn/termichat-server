import { Event } from './event';

export class PeopleEvent extends Event<string[]> {
  public channel: string;
}
