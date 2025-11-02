import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { uploadChatImage } from '@/lib/chat-upload';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (user.isChatBlocked) {
      return new NextResponse("Chat access blocked", { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    const imageUrl = await uploadChatImage(file);

    return NextResponse.json({ 
      imageUrl 
    });

  } catch (error: any) {
    console.error('Chat upload error:', error);
    return new NextResponse('InternalError', { status: 500 });
  }
}