import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function saveFile(file: File): Promise<{ url: string; filename: string }> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('File size too large');
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const fileExtension = path.extname(file.name) || '.jpg';
  const filename = `${uuidv4()}${fileExtension}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  await writeFile(filepath, buffer);

  const url = filename;
  
  return { url, filename };
}

export async function deleteUserImage(filename: string): Promise<void> {
  try {
    const filepath = path.join(UPLOAD_DIR, filename);
    await unlink(filepath);
  } catch (error) {
    console.error('Error deleting user image:', error);
  }
}

export function validateFile(file: File): { isValid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File too large' };
  }

  return { isValid: true };
}