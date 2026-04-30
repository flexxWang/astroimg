import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { MessageService } from './message.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { SearchMessageDto } from './dto/search-message.dto';
import { ListMessageDto } from './dto/list-message.dto';

@ApiTags('Messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiOperation({ summary: '获取当前用户会话列表' })
  @Get('conversations')
  listConversations(@CurrentUser() user: { id: string }) {
    return this.messageService.listConversations(user.id);
  }

  @ApiOperation({ summary: '分页获取会话消息列表' })
  @Get('conversations/:id')
  listMessages(
    @Param('id') id: string,
    @Query() dto: ListMessageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.messageService.listMessages(user.id, id, dto.cursor);
  }

  @ApiOperation({ summary: '在会话内搜索消息' })
  @Get('conversations/:id/search')
  searchMessages(
    @Param('id') id: string,
    @Query() dto: SearchMessageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.messageService.searchMessages(user.id, id, dto.keyword);
  }

  @ApiOperation({ summary: '发送私信消息' })
  @Post('send')
  send(@Body() dto: SendMessageDto, @CurrentUser() user: { id: string }) {
    return this.messageService.sendMessage(
      user.id,
      dto.recipientId,
      dto.content,
    );
  }

  @ApiOperation({ summary: '将会话内消息标记为已读' })
  @Post('read')
  markRead(@Body() dto: MarkReadDto, @CurrentUser() user: { id: string }) {
    return this.messageService.markRead(user.id, dto.conversationId);
  }
}
