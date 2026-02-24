import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessToken } from './entities/generate_token.entity';
import { GenerateTokenService } from './generate_token.service';
import { GenerateTokenController } from './generate_token.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccessToken])],
  controllers: [GenerateTokenController],
  providers: [GenerateTokenService],
  exports: [GenerateTokenService],
})
export class GenerateTokenModule {}
