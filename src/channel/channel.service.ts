import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ChannelService {
  public joinChannel(): any {
    throw new WsException('Not implemented');
  }

  public leaveChannel(): any {
    throw new WsException('Not implemented');
  }

  public sendMessage(): any {
    throw new WsException('Not implemented');
  }
}
