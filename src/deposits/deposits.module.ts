import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from './entities/deposit.entity';
import { Bank } from './entities/bank.entity';
import { DepositsService } from './deposits.service';
import { DepositsController } from './deposits.controller';
import { UploadAwsModule } from 'src/upload-aws/upload-aws.module';

@Module({
  imports: [TypeOrmModule.forFeature([Deposit, Bank]), UploadAwsModule],
  controllers: [DepositsController],
  providers: [DepositsService],
  exports: [DepositsService],
})
export class DepositsModule {}
