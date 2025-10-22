import { BonusTracker } from '@/components/bonus-tracker';
import { PromoCodeForm } from '@/components/promo-code-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Gift, Sparkles, Zap } from 'lucide-react';

async function getUserPromoCode(userId: string) {
  return await db.userPromoCode.findFirst({
    where: { userId },
    include: {
      promoCode: true,
      user: {
        select: {
          bonuses: {
            where: {
              status: 'PENDING_WAGERING'
            },
            include: {
              promoCode: {
                select: { code: true, description: true }
              }
            }
          }
        }
      }
    }
  });
}

export default async function PromoCodePage() {
  const user = await currentUser();
  if (!user?.id) {
    return <div>Please log in to access this page.</div>;
  }

  const userPromoCode = await getUserPromoCode(user.id);

  return (
    <div className="min-h-screen sm:px-6 lg:px-8 pb-[60px] lg:pb-0">
      <div className="max-w-6xl mx-auto">
        <div className="text-center sm:mb-8 mb-4">
          <div className="flex items-center justify-center gap-3 sm:mb-4 mb-1">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
              <Gift className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400 relative z-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Promo codes
            </h1>
          </div>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            Unlock exclusive bonuses, free spins, and special rewards
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <div className="lg:col-span-1 xl:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Enter promo code</CardTitle>
                    <CardDescription className="text-gray-400">
                      {userPromoCode 
                        ? `Active code: ${userPromoCode.promoCode.code}`
                        : 'Claim your exclusive bonus'
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PromoCodeForm 
                  hasUsedPromoCode={!!userPromoCode}
                  currentPromoCode={userPromoCode?.promoCode.code}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 xl:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Your bonuses</CardTitle>
                    <CardDescription className="text-gray-400">
                      Track your active rewards and progress
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='sm:p-6 p-2'>
                <BonusTracker />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}