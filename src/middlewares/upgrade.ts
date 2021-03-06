import * as cp from 'child_process';
import { v4 } from 'uuid';
import {
  CGIMiddleware,
  CGIResponse,
  MiddlewareRequestMethod,
  info,
  getConfig,
  error,
} from '@vize/cgi';
import { ExecSyncOptionsWithStringEncoding } from 'child_process';

export const upgrade: CGIMiddleware = {
  apply: async (request) => {
    setTimeout(async () => {
      const options: ExecSyncOptionsWithStringEncoding = {
        cwd: process.cwd(),
        encoding: 'utf-8',
      };
      const { npmRegistry } = getConfig();
      const result: { [key: string]: string } = {};
      try {
        result['pull'] = await cp.execSync('git pull', options);
        result['install'] = await cp.execSync(
          `npm ci${npmRegistry ? ` --registry ${npmRegistry}` : ''}`,
          options,
        );
        result['build'] = await cp.execSync('npm run build', options);
      } catch (e) {
        error('Middlewares.upgrade', 'Error occurred while upgrading', {
          error: e,
        });
        return;
      }

      info(
        'Middlewares.upgrade',
        'Ready to restart for upgrading after 1s',
        result,
      );
      setTimeout(() => cp.execSync('pm2 restart pm2.json', options), 1000);
    }, 0);

    info(
      'Middlewares.upgrade',
      'Start upgrade automatically triggered by webhook',
      { push: request.body.read },
    );
    return CGIResponse.success(
      v4(),
      'Start upgrade automatically triggered by webhook',
    );
  },
  forRoutes: [{ path: '/upgrade', method: MiddlewareRequestMethod.ALL }],
};
