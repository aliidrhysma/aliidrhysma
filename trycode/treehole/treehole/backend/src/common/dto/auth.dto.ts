import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MaxLength(50)
  nickname: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

export class LoginDto {
  @IsString()
  userId: string;
}

export class UpdateUserInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
