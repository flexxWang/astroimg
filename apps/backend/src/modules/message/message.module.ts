import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { Message } from './message.entity';
import { Conversation } from './conversation.entity';
import { User } from '../user/user.entity';
import { MessageGateway } from './message.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PresenceService } from './presence.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation, User]),
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway, PresenceService],
})
export class MessageModule {}
