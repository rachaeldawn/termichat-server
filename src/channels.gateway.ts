import { Client, Server, Socket } from 'socket.io';
import { Event } from './models/event';
import { StringEvent } from './models/join';
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
  OnGatewayInit,
} from '@nestjs/websockets';
import { UserService } from './user/user.service';
import { GetUser } from './user/get-user.decorator';
import { PeopleEvent } from './models/people';
import { ChatEvent } from './models/chat';
import { ListChannelEvent, IChannel } from './models/list-channel';

@UsePipes(new ValidationPipe())
@WebSocketGateway(8080, { namespace: 'channels' })
export class ChannelsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  // id, name
  private channels: Map<string, string> = new Map<string, string>();

  @WebSocketServer()
  private server: Server;

  constructor(@Inject(UserService) private users: UserService) {
    this.channels.set(v4(), 'lobby');
  }

  public afterInit(server: Server): void {
    console.log('Gateway ready and listening');
  }

  @SubscribeMessage('identify')
  public changeName(client: Socket, payload: StringEvent): void {
    const user = this.users.get(client.id);
    if (user == null) {
      throw new WsException('User does not exist');
    }
    const oldName = user.name;
    this.users.rename(user.id, payload.data);

    for (const room of Object.keys(client.rooms)) {
      if (room === user.id) {
        continue;
      }

      this.serverSay(room, `${oldName} is now ${payload.data}`);
    }
  }

  public handleConnection({ id }: Socket): void {
    this.users.add(id);
  }

  public handleDisconnect({ id }: Socket): void {
    this.users.remove(id);
  }

  @SubscribeMessage('join')
  public joinChannel(client: Socket, payload: StringEvent): void {
    const user = this.users.get(client.id);
    if (user == null) {
      // shouldn't I just register them anyway?
      throw new WsException('Could not find user');
    }

    let channelId = this.channelId(payload.data);
    if (channelId == null) {
      const id = v4();
      this.channels.set(id, payload.data);
      channelId = id;
    }

    client.join(payload.data);
    this.serverSay(channelId, `${user.name} joined.`);
  }

  @SubscribeMessage('leave')
  public leaveChannel(client: Socket, payload: StringEvent): any {
    const user = this.users.get(client.id);
    if (user == null) {
      throw new WsException('Could not find user');
    }

    const channelId = this.channelId(payload.data);
    if (channelId == null) {
      return;
    }

    client.leave(channelId);
  }

  @SubscribeMessage('people')
  public async listChannelParticipants(
    client: Socket,
    payload: StringEvent
  ): Promise<PeopleEvent> {
    let partIds: string[];
    try {
      partIds = await this.participants(payload.data);
    } catch (err) {
      throw new WsException('Room does not exist');
    }

    const users = partIds.map(id => this.users.get(id)!);

    return {
      event: 'people',
      channel: payload.data,
      data: users.map(a => a.name),
    };
  }

  @SubscribeMessage('channels')
  public listChannels(client: Socket): ListChannelEvent {
    const data: IChannel[] = [];
    for (const [ id, name ] of this.channels.entries()) {
      data.push({ id, name });
    }
    return { event: 'channels', data };
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
    this.serverSay(
      channel,
      `${user.name} changed channel name to ${payload.newName}`
    );
  }

  @SubscribeMessage('send')
  public sendMessage(client: Socket, payload: ChatEvent): void {
    this.server.of(payload.channel).send(payload);
  }

  private channelId(target: string): string | null {
    for (const [id, name] of this.channels.entries()) {
      if (target === name) {
        return id;
      }
    }
    return null;
  }

  private participants(channelId: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.server.of(channelId).clients((err: Error, clients: string[]) => {
        if (err) {
          return reject(err);
        }

        resolve(clients);
      });
    });
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
