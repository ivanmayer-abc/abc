import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

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

    const result = await db.$transaction(async (tx) => {
      const existingUserPromoCode = await tx.userPromoCode.findFirst({
        where: { userId: user.id },
        include: { promoCode: true }
      });

      if (existingUserPromoCode) {
        throw new Error(`You have already used promo code: ${existingUserPromoCode.promoCode.code}. Only one promo code per account is allowed.`);
      }

      const promoCode = await tx.promoCode.findFirst({
        where: {
          code: code.toUpperCase(),
          status: 'ACTIVE',
          startDate: { lte: new Date() },
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        }
      });

      if (!promoCode) {
        throw new Error("Invalid or expired promo code");
      }

      if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
        throw new Error("Promo code has reached maximum uses");
      }

      const userPromoCodeCheck = await tx.userPromoCode.findFirst({
        where: { 
          userId: user.id,
          promoCodeId: promoCode.id 
        }
      });

      if (userPromoCodeCheck) {
        throw new Error("You have already used this promo code");
      }

      const userPromoCode = await tx.userPromoCode.create({
        data: {
          userId: user.id,
          promoCodeId: promoCode.id,
          timesUsed: 1,
          lastUsedAt: new Date()
        }
      });

      await tx.promoCode.update({
        where: { id: promoCode.id },
        data: { currentUses: { increment: 1 } }
      });

      // Handle different bonus types - FIXED: Include COMBINED type
      if (promoCode.type === 'DEPOSIT_BONUS' || promoCode.type === 'COMBINED') {
        // For deposit bonuses and combined bonuses, don't create bonus record until deposit
        return { promoCode, userPromoCode, bonus: null };
      }

      // For other bonus types, create the bonus record immediately
      let bonusData: any = {
        userId: user.id,
        promoCodeId: promoCode.id,
        amount: 0,
        bonusAmount: 0,
        remainingAmount: 0,
        wageringRequirement: promoCode.wageringRequirement || 0,
        type: promoCode.type,
        status: 'PENDING_WAGERING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      switch (promoCode.type) {
        case 'FREE_SPINS':
          bonusData = {
            ...bonusData,
            freeSpinsCount: promoCode.freeSpinsCount,
            freeSpinsGame: promoCode.freeSpinsGame,
            freeSpinsUsed: 0,
            freeSpinsWinnings: 0
          };
          break;
        case 'CASHBACK':
          bonusData.cashbackPercentage = promoCode.cashbackPercentage;
          break;
        case 'FREE_BET':
          bonusData.bonusAmount = promoCode.maxBonusAmount?.toNumber() || 0;
          bonusData.remainingAmount = bonusData.bonusAmount;
          break;
      }

      const bonus = await tx.bonus.create({
        data: bonusData
      });

      return { promoCode, bonus, userPromoCode };
    });

    return NextResponse.json({
      success: true,
      bonus: result.bonus,
      message: `Promo code applied successfully! ${result.promoCode.description}`
    });

  } catch (error: any) {
    console.log('[PROMO_CODE_APPLY]', error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 400 }
    );
  }
}