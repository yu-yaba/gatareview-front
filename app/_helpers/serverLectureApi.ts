import 'server-only';

import type { LectureSchema } from '@/app/_types/LectureSchema';

const DEFAULT_LOCAL_BACKEND_URL = 'http://localhost:3001';
const METADATA_REVALIDATE_SECONDS = 300;

function getBackendBaseUrl() {
  const backendUrl =
    process.env.DOCKER_BACKEND_URL ||
    process.env.NEXT_PUBLIC_ENV ||
    DEFAULT_LOCAL_BACKEND_URL;

  return backendUrl.replace(/\/$/, '');
}

export async function getLectureForMetadata(id: string): Promise<LectureSchema | null> {
  try {
    const response = await fetch(`${getBackendBaseUrl()}/api/v1/lectures/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GataReview-NextJS-Metadata/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: METADATA_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as LectureSchema;
  } catch (error) {
    console.error('Error fetching lecture metadata:', error);
    return null;
  }
}

export { METADATA_REVALIDATE_SECONDS };
