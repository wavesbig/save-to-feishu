import { createStorage, StorageEnum } from '../base/index.js';

export interface FeishuStorageType {
  accessToken?: string | null;
  refreshToken?: string | null;
  userId?: string | null;
  saveHistory: Array<{
    id: string;
    title: string;
    url: string;
    target: 'doc' | 'wiki' | 'note';
    targetId: string;
    saveTime: number;
  }>;
  savePreferences: {
    defaultTarget: 'doc' | 'wiki' | 'note';
    defaultWikiId?: string;
    includeTags: boolean;
    includeScreenshot: boolean;
  };
}

export const feishuStorage = createStorage<FeishuStorageType>(
  'feishu',
  {
    accessToken: null,
    refreshToken: null,
    userId: null,
    saveHistory: [],
    savePreferences: {
      defaultTarget: 'doc',
      defaultWikiId: undefined,
      includeTags: true,
      includeScreenshot: false,
    },
  },
  {
    storageEnum: StorageEnum.Local,
  },
);
