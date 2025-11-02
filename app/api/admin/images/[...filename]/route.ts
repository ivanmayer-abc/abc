import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.ADMIN_API_KEY;
    
    if (!apiKey || apiKey !== validApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filename = params.filename[0];
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 });
    }

    const filepath = path.join(UPLOAD_DIR, filename);
    
    try {
      const fileBuffer = await readFile(filepath);
      
      const contentType = getContentType(filename);
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('Admin image serve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}