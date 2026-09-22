import type { FlavorTemplate } from './types';

export async function persistFlavorTemplate(flavor: FlavorTemplate): Promise<void> {
  if (!import.meta.env.DEV) {
    throw new Error('persistFlavorTemplate is only available in DEV');
  }
  const res = await fetch('/api/save-flavor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flavor),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`save-flavor failed: ${res.status} ${body}`);
  }
}

export async function persistCardImage(imageName: string, imageBlob: Blob): Promise<void> {
  if (!import.meta.env.DEV) {
    throw new Error('persistCardImage is only available in DEV');
  }
  const buffer = await imageBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const res = await fetch('/api/save-card-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageName,
      imageBase64: base64,
      contentType: imageBlob.type || 'image/jpeg',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`save-card-image failed: ${res.status} ${body}`);
  }
}
