import {
  MessageType,
  getBitableRecords,
  getBitableFields,
  setupBackgroundMessageRouter,
  registerRequestHandler,
} from '@extension/shared';
import 'webextension-polyfill';

registerRequestHandler(MessageType.GET_BITABLE_RECORDS, async payload => await getBitableRecords(payload));
registerRequestHandler(MessageType.GET_BITABLE_FIELDS, async payload => await getBitableFields(payload));

setupBackgroundMessageRouter();
