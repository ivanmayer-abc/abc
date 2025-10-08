import TransactionsList from './components/transactions-list';
import { currentUser } from '@/lib/auth';
import { ImageUploadWrapper } from '../_components/image-upload-wrapper';

const TransactionsPage = async () => {
  const user = await currentUser();
  const userImage = user?.image;
  const userId = user?.id;
  const isBlocked = user?.isBlocked ?? false;

  if (!user) {
    return <div>login to continue</div>
  }
  
  if (user?.isImageApproved === "success") {
    return (
      <div className="flex flex-col">
        <TransactionsList isBlocked={isBlocked} />
      </div>
    );
  }

  if (user?.isImageApproved === "pending") {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-[-110px] h-screen">
      <div className="p-6 shadow-md rounded-lg">
        <h2 className="text-3xl font-semibold mb-4">Please wait for approval</h2>
        <p className="text-gray-300 text-xl mb-8">
          It may take from a few minutes up to 24 hours
        </p>
      </div>
    </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center text-center mt-[-110px] h-screen">
      <div className="p-6 shadow-md rounded-lg">
        <h2 className="text-3xl font-semibold mb-4">Upload your passport</h2>
        <p className="text-gray-300 text-xl mb-8">
          Take a selfie of you holding your passport and wait for approval to continue
        </p>
        <ImageUploadWrapper userImage={userImage} userId={userId} />
      </div>
    </div>
  );
};

export default TransactionsPage;