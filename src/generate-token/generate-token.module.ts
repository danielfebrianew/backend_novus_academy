import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessToken } from './entities/generate-token.entity';
import { GenerateTokenService } from './generate-token.service';
import { GenerateTokenController } from './generate-token.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccessToken])],
  controllers: [GenerateTokenController],
  providers: [GenerateTokenService],
  exports: [GenerateTokenService],
})
export class GenerateTokenModule {}
