import crypto from 'crypto';

export const nodeId = crypto.createHash('sha1')
  .update(process.execPath)
  .update(process.version)
  .digest('hex');
