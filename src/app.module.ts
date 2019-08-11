import { Module } from '@nestjs/common';
import { UserService } from './user/user.service';
import { ChannelsGateway } from './channels.gateway';

@Module({
  controllers: [],
  providers: [UserService, ChannelsGateway],
  imports: [],
})
export class AppModule {}
