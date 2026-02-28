import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

interface RequestWithUser extends Request {
  user?: { id?: string };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const { method, url, user } = req;
    const userId = user?.id ?? 'anonymous';
    const start = Date.now();

    this.logger.debug(`[Req] ${method} ${url} userId=${userId}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const status = context
            .switchToHttp()
            .getResponse<{ statusCode: number }>().statusCode;
          this.logger.debug(
            `[Res] ${status} ${method} ${url} ${ms}ms userId=${userId}`,
          );
        },
        error: (err: Error) => {
          const ms = Date.now() - start;
          this.logger.error(
            `[Err] ${method} ${url} ${ms}ms userId=${userId} — ${err.message}`,
          );
        },
      }),
    );
  }
}
