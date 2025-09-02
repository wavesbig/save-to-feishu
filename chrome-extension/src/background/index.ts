import {
  MessageType,
  getBitableRecords,
  setupBackgroundMessageRouter,
  registerRequestHandler,
} from '@extension/shared';
import 'webextension-polyfill';

registerRequestHandler(MessageType.GET_BITABLE_RECORDS, async payload => await getBitableRecords(payload));

setupBackgroundMessageRouter();
