import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: '接收方用户 ID',
    example: '1b2f7e80-2db1-4e27-9527-4f40f4479f9d',
  })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({
    description: '消息内容',
    example: '你昨晚那张木星拍得真不错，参数方便分享一下吗？',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
