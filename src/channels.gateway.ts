import { Client, Server, Socket } from 'socket.io';
import { Event } from './models/event';
import { JoinEvent } from './models/join';
import { UsePipes, ValidationPipe, Inject } from '@nestjs/common';
import { RenameEvent } from './models/rename';
import { v4 } from 'uuid';

import {
  SubscribeMessage,
  WebSocketGateway,
  WsException,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UserService } from './user/user.service';
import { GetUser } from './user/get-user.decorator';

@UsePipes(new ValidationPipe())
@WebSocketGateway(8080, { namespace: 'channels' })
export class ChannelsGateway
  implements OnGatewayConnection, OnGatewayDisconnect {

  private channels: Map<string, string> = new Map<string, string>();

  @WebSocketServer()
  private server: Server;

  constructor(@Inject(UserService) private users: UserService) {
    this.channels.set(v4(), 'lobby');
  }

  public handleConnection({id}: Socket): void {
    this.users.add(id);
  }

  public handleDisconnect({id}: Socket): void {
    this.users.remove(id);
  }

  @SubscribeMessage('join')
  public joinChannel(client: Socket, payload: JoinEvent): any {
    const channelId = this.channelId(payload.data);
    if (channelId == null) {
      this.channels.set(v4(), payload.data);
    }

    client.join(payload.data);
    // broadcast that someone has joined
  }

  @SubscribeMessage('channels')
  public listChannels(client: Socket, payload: any): Event<string[]> {
    return { event: 'channels', data: Array.from(this.channels.values()) };
  }

  @SubscribeMessage('rename')
  public renameChannel(client: Socket, payload: RenameEvent): void {

    // this needs to be a guard somehow
    const user = this.users.get(client.id);
    if (user == null) {
      throw new WsException('User was not found');
    }

    const channel = this.channelId(payload.data);
    if (channel == null) {
      throw new WsException('Given channel does not exist');
    }

    const newName = this.channelId(payload.newName);
    if (newName != null) {
      throw new WsException('Channel already exists');
    }

    this.channels.set(channel, payload.newName);
    this.serverSay(channel, `${user.name} changed channel name to ${payload.newName}`);
  }

  private channelId(target: string): string | null {
    for (const [id, name] of this.channels.entries()) {
      if (target === name) {
        return id;
      }
    }
    return null;
  }

  private sendToChannel(
    channelId: string,
    name: string,
    message: string
  ): void {
    this.server
      .of(channelId)
      .send({ event: 'chat', data: message, sender: name });
  }

  private serverSay(channelId: string, message: string): void {
    this.sendToChannel(channelId, 'SERVER', message);
  }
}
