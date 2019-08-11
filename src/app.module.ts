import { Module } from '@nestjs/common';
import { ChannelService } from './channel/channel.service';
import { ChannelService } from './channel/channel.service';
import { UserService } from './user/user.service';

@Module({
  controllers: [],
  providers: [ChannelService, UserService],
  imports: [],
})
export class AppModule {}
