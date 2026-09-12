import { callApi } from '../apiClient';
import { APP_CONTENT } from '../endpoints';

export interface AppContentResponse {
  id: string;
  data: string;
}

export const appContentService = {
  get: (id: string) =>
    callApi<null, AppContentResponse>({ method: 'get', url: APP_CONTENT.GET(id) }),
};
