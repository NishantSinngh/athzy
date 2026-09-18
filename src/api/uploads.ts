import { BackendAPI } from './backend';

export async function uploadImage(uri: string, fileName: string, contentType: 'image/jpeg' | 'image/png' | 'image/webp', purpose: 'avatar' | 'community') {
  const { upload } = await BackendAPI.createImageUpload({ fileName, contentType, purpose });
  const fileResponse = await fetch(uri);
  const body = await fileResponse.blob();
  const uploadResponse = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body,
  });
  if (!uploadResponse.ok) throw new Error('Image upload failed. Please try again.');
  return upload.publicUrl as string;
}
