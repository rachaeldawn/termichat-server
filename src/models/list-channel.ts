import { Event } from './event';

export interface IChannel {
  id: string;
  name: string;
}

export class ListChannelEvent extends Event<IChannel[]> {
  public data: IChannel[];
}
