import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { CartItemValidationSchema } from "@/lib/security/validation";

const CartValidationRequestSchema = z.object({
  items: z.array(CartItemValidationSchema),
  promoCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = CartValidationRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid cart payload." },
        { status: 400 }
      );
    }

    const { items, promoCode } = parseResult.data;
    const validatedCart = db.recalculateCart(items, promoCode);

    return NextResponse.json({
      cart: validatedCart,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Cart recalculation failed." },
      { status: 500 }
    );
  }
}
