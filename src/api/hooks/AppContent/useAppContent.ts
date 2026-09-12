import { useEffect, useState } from 'react';
import { appContentService } from '../../services/appContentService';

export const useAppContent = (id: string) => {
  const [html, setHtml]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    appContentService
      .get(id)
      .then((res) => setHtml(res.data))
      .catch((err) => setError(err.message ?? 'Failed to load content'))
      .finally(() => setLoading(false));
  }, [id]);

  return { html, loading, error };
};
