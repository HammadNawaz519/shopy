import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.apcaymgrxzjrlbtnohxx:Hammad519..@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

async function main() {
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const updates = [
    {
      id: "prod-1",
      colors: [
        { name: "Raw Ecru", hex: "#F4F4F2", imageUrl: "/category-tops.jpg" },
        { name: "Obsidian Slate", hex: "#495464", imageUrl: "/product-linen-overshirt.jpg" },
        { name: "Muted Bone", hex: "#E8E8E8", imageUrl: "/category-tops.jpg" },
      ],
    },
    {
      id: "prod-2",
      colors: [
        { name: "Charcoal Slate", hex: "#495464", imageUrl: "/category-bottoms.jpg" },
        { name: "Pebble Grey", hex: "#BBBFCA", imageUrl: "/product-linen-pants.jpg" },
      ],
    },
    {
      id: "prod-8",
      colors: [
        { name: "Bleached Sand", hex: "#E8E8E8", imageUrl: "/product-linen-pants.jpg" },
        { name: "Dark Slate", hex: "#495464", imageUrl: "/category-bottoms.jpg" },
      ],
    },
    {
      id: "prod-9",
      colors: [
        { name: "Natural Flax", hex: "#E8E8E8", imageUrl: "/product-linen-overshirt.jpg" },
        { name: "Charcoal Slate", hex: "#495464", imageUrl: "/category-tops.jpg" },
      ],
    },
  ];

  for (const u of updates) {
    await pool.query(
      `UPDATE products SET colors = $1, updated_at = NOW() WHERE id = $2;`,
      [JSON.stringify(u.colors), u.id]
    );
    console.log(`Updated colors with imageUrl for ${u.id}`);
  }

  const res = await pool.query(`SELECT id, name, colors FROM products WHERE id = 'prod-1';`);
  console.log("\nConfirmed prod-1 in DB:", JSON.stringify(res.rows[0], null, 2));

  await pool.end();
}

main().catch(console.error);
