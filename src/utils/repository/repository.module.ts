import { Module } from '@nestjs/common';

//---- Provider
import { AwsModule } from '../../providers/aws/aws.module';

//---- Utils
import { LoggerModule } from '../logger/logger.module';

//---- Service

@Module({
    imports: [LoggerModule, AwsModule],
    providers: [],
    exports: [],
})
export class RepositoryModule {}
