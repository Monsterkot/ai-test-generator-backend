import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  isString,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email can`t be empty' })
  email: string;

  @IsNotEmpty({ message: 'Password can`t be empty' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsNotEmpty({ message: 'Name can`t be empty' })
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  @IsIn(['USER', 'ADMIN'], { message: 'Invalid role' })
  role: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name can`t be empty' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email can`t be empty' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password can`t be empty' })
  password?: string;

  @IsOptional()
  @IsString()
  @IsIn(['USER', 'ADMIN'], { message: 'Invalid role' })
  role?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class CheckEmailDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
