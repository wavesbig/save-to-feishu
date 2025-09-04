import {
  MessageType,
  getBitableRecords,
  getBitableFields,
  createBitableRecord,
  uploadMedia,
  setupBackgroundMessageRouter,
  registerRequestHandler,
} from '@extension/shared';
import 'webextension-polyfill';

registerRequestHandler(MessageType.GET_BITABLE_RECORDS, async payload => await getBitableRecords(payload));
registerRequestHandler(MessageType.GET_BITABLE_FIELDS, async payload => await getBitableFields(payload));
registerRequestHandler(MessageType.CREATE_BITABLE_RECORD, async payload => await createBitableRecord(payload));
registerRequestHandler(MessageType.UPLOAD_MEDIA, async payload => await uploadMedia(payload));

setupBackgroundMessageRouter();
