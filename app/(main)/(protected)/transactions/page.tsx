import { currentUser } from '@/lib/auth';
import { ImageUploadWrapper } from '../_components/image-upload-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Upload } from 'lucide-react';
import TransactionsList from './components/transactions-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const TransactionsPage = async () => {
  const user = await currentUser();
  const userImage = user?.image;
  const userId = user?.id;
  const isBlocked = user?.isBlocked ?? false;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.isImageApproved === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Verification in Progress</CardTitle>
            <CardDescription className="text-lg">
              Your documents are under review
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              It may take from a few minutes up to 24 hours for approval. You&apos;ll be notified once your verification is complete.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-600">
              <Clock className="h-4 w-4" />
              <span>Status: Pending Approval</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.isImageApproved !== "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Identity Verification Required</CardTitle>
            <CardDescription className="text-lg">
              Please verify your identity to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Take a clear selfie of you holding your passport and wait for approval to continue
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <ImageUploadWrapper userImage={userImage} userId={userId} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <TransactionsList isBlocked={isBlocked} />;
};

export default TransactionsPage;