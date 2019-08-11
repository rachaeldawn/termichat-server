import { Client } from 'socket.io';

export class User {
  public client: Client;
  public id: string;
  public name: string;
  public seen: number; // Date.now();
}
