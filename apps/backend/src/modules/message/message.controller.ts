import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { MessageService } from './message.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { SearchMessageDto } from './dto/search-message.dto';
import { ListMessageDto } from './dto/list-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: { id: string }) {
    return this.messageService.listConversations(user.id);
  }

  @Get('conversations/:id')
  listMessages(
    @Param('id') id: string,
    @Query() dto: ListMessageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.messageService.listMessages(user.id, id, dto.cursor);
  }

  @Get('conversations/:id/search')
  searchMessages(
    @Param('id') id: string,
    @Query() dto: SearchMessageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.messageService.searchMessages(user.id, id, dto.keyword);
  }

  @Post('send')
  send(@Body() dto: SendMessageDto, @CurrentUser() user: { id: string }) {
    return this.messageService.sendMessage(
      user.id,
      dto.recipientId,
      dto.content,
    );
  }

  @Post('read')
  markRead(@Body() dto: MarkReadDto, @CurrentUser() user: { id: string }) {
    return this.messageService.markRead(user.id, dto.conversationId);
  }
}
