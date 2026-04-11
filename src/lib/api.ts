import type {
  GenerateImagePayload,
  GenerateImageResponse,
  ImageGenerationErrorResponse
} from '@/types/generation';
import { resolveApiUrl } from '@/lib/runtime-config';

export async function generateImage(
  payload: GenerateImagePayload,
  locale: string
): Promise<GenerateImageResponse> {
  const response = await fetch(resolveApiUrl('/generate-image'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Locale': locale
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ImageGenerationErrorResponse | null;
    throw new Error(error?.error ?? '生成失败，请稍后重试。');
  }

  return (await response.json()) as GenerateImageResponse;
}
