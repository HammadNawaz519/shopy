import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/security/session";
import { consumeDestructiveAuth } from "@/lib/security/destructiveAuth";
import { transaction } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Admin DB reset: wipe ALL data records, but KEEP media_assets so every
 * image (product/gallery/campaign) still resolves. App-level settings are
 * re-seeded to their clean defaults (mirrors scripts/clear-all-db.mjs,
 * without the media wipe).
 *
 * Guarded three ways (all server-side — the frontend only ever submits,
 * never authorizes):
 *   1. Admin session (getAdminUser).
 *   2. Typed confirmation in the body ({ confirm: "RESET" }).
 *   3. A short-lived, SINGLE-USE Google re-auth authorization (authToken),
 *      issued ONLY by the verified Google callback and bound to this exact
 *      admin identity + the RESET_DB operation. Expired, replayed, or
 *      mismatched tokens are rejected. Consume happens BEFORE the
 *      transaction — a token can never authorize two resets.
 */
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Admin privileges required." },
      { status: 403 }
    );
  }

  let body: { confirm?: string; authToken?: string } = {};
  try {
    body = await req.json();
  } catch {
    // non-JSON body
  }
  if (body.confirm !== "RESET") {
    return NextResponse.json(
      { error: "Confirmation required: send { confirm: 'RESET' }." },
      { status: 400 }
    );
  }

  // Google re-auth gate: verify + consume the single-use authorization.
  const authCheck = await consumeDestructiveAuth(
    body.authToken,
    { userId: admin.userId, email: admin.email },
    "RESET_DB"
  );
  if (!authCheck.ok) {
    const reasonMap: Record<typeof authCheck.reason, string> = {
      missing:
        "Google re-authentication required: no valid authorization found. Start the reset via the DB Reset panel and verify with Google.",
      expired:
        "Re-authentication has expired (10-minute window). Verify with Google again.",
      mismatch:
        "Authorization mismatch: this token was issued for a different admin account or operation.",
      replayed:
        "This authorization was already used. Each Google verification authorizes exactly one reset.",
    };
    return NextResponse.json(
      { error: reasonMap[authCheck.reason] },
      { status: 403 }
    );
  }

  try {
    await transaction(async (client) => {
      // 1. Wipe every data table. media_assets is deliberately absent —
      //    image records (and the files they point at) survive the reset.
      await client.query(`
        TRUNCATE TABLE
          order_items,
          orders,
          reviews,
          product_images,
          products,
          categories,
          discounts,
          user_carts,
          inquiries,
          newsletter_subscribers,
          users
        RESTART IDENTITY CASCADE;
      `);

      // 2. Reset store_settings to clean initial defaults.
      await client.query(`
        DELETE FROM store_settings;
        INSERT INTO store_settings (
          id, store_name, support_email, currency, currency_symbol,
          free_shipping_threshold, flat_shipping_rate, tax_percentage,
          order_notifications, inventory_alert_threshold,
          cod_enabled, bank_transfer_enabled,
          updated_at
        ) VALUES (
          'settings_default', 'SHOPY Atelier', 'concierge@shopy.com', 'PKR', 'Rs.',
          15000, 500, 0,
          true, 5,
          true, true,
          NOW()
        );
      `);

      // 3. Reset homepage_config to clean initial defaults.
      await client.query(`
        DELETE FROM homepage_config;
        INSERT INTO homepage_config (
          id, hero_title, hero_subtitle, hero_image, hero_cta_text, hero_cta_link,
          featured_title, featured_subtitle, editorial_tag, editorial_title, editorial_quote,
          editorial_image_1, editorial_image_2, newsletter_title, newsletter_subtitle, updated_at
        ) VALUES (
          'home_default',
          'ARCHITECTURAL ELEGANCE',
          'EDITION 01 • AUTUMN / WINTER 2026',
          '/hero-luxury.jpg',
          'Explore Collection',
          '/products',
          'Featured Essentials',
          'SELECTION OF THE SEASON',
          'EDITORIAL CAMPAIGN',
          'Permanence in Form & Texture',
          'We reject the cycle of seasonal excess. Each silhouette is engineered with tactile permanence, heavyweight organic knits, and architectural draping.',
          '/editorial-craft.jpg',
          '/category-tops.jpg',
          'Join The Maison Gazette',
          'Receive private vernissage previews, seasonal lookbooks, and invitation-only atelier dispatches.',
          NOW()
        );
      `);

      // 4. Reset navigation_items to the default clean items.
      await client.query(`
        DELETE FROM navigation_items;
        INSERT INTO navigation_items (id, name, href, order_index, is_active, category_slug)
        VALUES
          ('nav_1', 'home', '/', 0, true, null),
          ('nav_2', 'view all', '/products', 1, true, null),
          ('nav_3', 'tops', '/collections/tops', 2, true, 'tops'),
          ('nav_4', 'bottoms', '/collections/bottoms', 3, true, 'bottoms'),
          ('nav_5', 'co-ord sets', '/collections/co-ord-sets', 4, true, 'co-ord-sets'),
          ('nav_6', 'footwear', '/collections/footwear', 5, true, 'footwear'),
          ('nav_7', 'fragrances', '/collections/fragrances', 6, true, 'fragrances'),
          ('nav_8', 'collections', '/collections', 7, true, null)
        ON CONFLICT (id) DO NOTHING;
      `);
    });

    return NextResponse.json({
      success: true,
      message:
        "Database reset complete. All data records wiped; image assets (media_assets) preserved.",
    });
  } catch (error) {
    console.error("[ADMIN DB RESET ERROR]", error);
    return NextResponse.json(
      {
        error: "Database reset failed.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
