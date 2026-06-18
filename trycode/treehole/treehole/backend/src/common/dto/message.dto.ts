import { IsString, IsOptional, IsArray, MaxLength, IsNumber, Min, Max } from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  @Min(1)
  @Max(3)
  contentType: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  isAnonymous?: boolean;
}
