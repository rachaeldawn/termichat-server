import { createParamDecorator } from '@nestjs/common';
import { UserService } from './user.service';
import { Socket } from 'socket.io';

export const GetUser = createParamDecorator(
  (client: Socket, users: UserService) => users.get(client.id)
);
