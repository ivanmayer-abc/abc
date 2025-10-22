import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

// Helper function to convert Decimal to number
const convertDecimalToNumber = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }
  return parseFloat(value) || null;
};

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    const promoCode = await db.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      },
      include: {
        userPromoCodes: {
          where: { userId: user.id }
        }
      }
    });

    if (!promoCode) {
      return NextResponse.json(
        { error: "Invalid or expired promo code" },
        { status: 404 }
      );
    }

    // Check max uses
    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return NextResponse.json(
        { error: "Promo code has reached maximum uses" },
        { status: 400 }
      );
    }

    // Check per user uses
    const userPromoCode = promoCode.userPromoCodes[0];
    if (promoCode.usesPerUser && userPromoCode && userPromoCode.timesUsed >= promoCode.usesPerUser) {
      return NextResponse.json(
        { error: "You have already used this promo code" },
        { status: 400 }
      );
    }

    // Check if user already has any promo code (one per account restriction)
    const existingUserPromoCode = await db.userPromoCode.findFirst({
      where: { userId: user.id },
      include: { promoCode: true }
    });

    if (existingUserPromoCode) {
      return NextResponse.json(
        { error: `You have already used promo code: ${existingUserPromoCode.promoCode.code}. Only one promo code per account is allowed.` },
        { status: 400 }
      );
    }

    // Calculate bonus details - Convert all Decimal fields to numbers
    let bonusDetails = {};
    
    switch (promoCode.type) {
      case 'DEPOSIT_BONUS':
      case 'COMBINED':
        bonusDetails = {
          bonusPercentage: promoCode.bonusPercentage,
          maxBonusAmount: convertDecimalToNumber(promoCode.maxBonusAmount),
          minDepositAmount: convertDecimalToNumber(promoCode.minDepositAmount),
          freeSpinsCount: promoCode.freeSpinsCount,
          freeSpinsGame: promoCode.freeSpinsGame,
          wageringRequirement: promoCode.wageringRequirement
        };
        break;
        
      case 'FREE_SPINS':
        bonusDetails = {
          freeSpins: promoCode.freeSpinsCount,
          game: promoCode.freeSpinsGame
        };
        break;
        
      case 'CASHBACK':
        bonusDetails = {
          cashbackPercentage: promoCode.cashbackPercentage
        };
        break;

      case 'FREE_BET':
        bonusDetails = {
          freeBetAmount: convertDecimalToNumber(promoCode.maxBonusAmount) || 0
        };
        break;
    }

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        type: promoCode.type,
        description: promoCode.description,
        ...bonusDetails
      }
    });

  } catch (error) {
    console.log('[PROMO_CODE_VALIDATE]', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}