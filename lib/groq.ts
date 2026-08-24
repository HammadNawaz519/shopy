export interface EditorialQuote {
  headline: string;
  subHeadline?: string;
  quote: string;
  author: string;
  reflection: string;
  theme: string;
  ctaText?: string;
}

const PSYCHOLOGICAL_EDITORIAL_QUOTES: EditorialQuote[] = [
  {
    headline: "YOU DON'T DRESS TO BE NOTICED.",
    subHeadline: "YOU DRESS TO BE IMPOSSIBLE TO FORGET.",
    quote: "Presence is psychological leverage. The human subconscious decodes authority, poise, and prestige before a single word is spoken. When your silhouette is undeniable, respect is instantaneous.",
    author: "Maison SHOPY Atelier Philosophy",
    reflection: "Every piece you choose is an unspoken statement of standard. While ordinary garments disappear in hesitation, master-tailored organic fibers and architectural lines activate subconscious confidence and effortless magnetism. Refuse compromise. Elevate your presence today.",
    theme: "The Psychology of Distinction",
    ctaText: "Claim Your Signature Silhouette"
  },
  {
    headline: "THE WORLD DOES NOT REWARD HESITATION.",
    subHeadline: "IT REWARDS UNCOMPROMISING PRESENCE.",
    quote: "People judge what they see long before they discover what you know. True luxury is not an indulgence—it is the psychological armor that transforms ordinary perception into quiet reverence.",
    author: "Sartorial Mastery Thesis",
    reflection: "Distinction is not accidental; it is an intentional decision made at the start of every day. Invest in pieces that communicate absolute conviction, supreme caliber, and timeless self-respect.",
    theme: "Sartorial Imperative",
    ctaText: "Acquire The Collection"
  },
  {
    headline: "PERFECTION IS NEVER ACCIDENTAL.",
    subHeadline: "IT IS A DELIBERATE STATEMENT OF POWER.",
    quote: "When you wear something engineered with architectural purity and rare materials, your demeanor shifts. You stand taller, speak with quiet certainty, and command the atmosphere without effort.",
    author: "Architectural Couture Principle",
    reflection: "Do not wait for an occasion to define your standard. The way you present yourself today establishes the doors that open tomorrow. Secure pieces that never lose their relevance.",
    theme: "The Standard of Caliber",
    ctaText: "Discover Signature Cuts"
  },
  {
    headline: "ORDINARY IS A CHOICE YOU REFUSE.",
    subHeadline: "TIMELESS ELEGANCE IS YOUR UNFAIR ADVANTAGE.",
    quote: "True luxury is subtle, yet profoundly magnetic. It doesn't scream for validation—it simply commands the gaze through perfection of proportion, weight, and immaculate drape.",
    author: "Tactile Permanence Archive",
    reflection: "Your wardrobe is a direct extension of your ambition. Why settle for fleeting trends when you can own enduring permanence? Step into the tier of craftsmanship you deserve.",
    theme: "Subtle Authority",
    ctaText: "Elevate Your Wardrobe"
  },
  {
    headline: "CONFIDENCE CANNOT BE SIMULATED.",
    subHeadline: "IT IS CRAFTED IN EVERY STITCH.",
    quote: "When texture, cut, and weight align in total harmony, self-doubt evaporates. You are not merely wearing fabric—you are stepping into the highest iteration of who you are.",
    author: "Atelier Identity Doctrine",
    reflection: "Every garment in this collection exists for one purpose: to give you an uncompromising edge in every room you enter. Don't leave your first impression to chance.",
    theme: "Psychological Alignment",
    ctaText: "Secure Your Presence"
  },
  {
    headline: "ELEGANCE IS NOT AN OPTION.",
    subHeadline: "IT IS THE HIGHEST FORM OF DISCIPLINE.",
    quote: "Mass production creates uniformity; bespoke craft creates legends. When you invest in rare textiles and tailored geometry, you make yourself an unforgettable anomaly.",
    author: "Modern Atelier Philosophy",
    reflection: "The silhouette you wear is your calling card. Choose garments crafted without shortcuts, designed to outlive seasons and maintain their majestic posture year after year.",
    theme: "Unyielding Standard",
    ctaText: "Shop Limited Edition"
  },
  {
    headline: "YOU ARE YOUR GREATEST ASSET.",
    subHeadline: "DRESS AS IF THE OUTCOME IS ALREADY WON.",
    quote: "High-status individuals don't dress for where they are—they dress for the dominion they are claiming. The psychology of prestige starts the moment you pull on true luxury.",
    author: "Atelier Executive Code",
    reflection: "Never compromise on your presentation. When every seam reflects supreme discernment, your confidence becomes completely unshakable. Claim your edge now.",
    theme: "Strategic Distinction",
    ctaText: "Explore The Lookbook"
  }
];

export async function fetchEditorialMotivationQuote(): Promise<EditorialQuote> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  // 1. Try Groq AI if key is present
  if (groqApiKey && groqApiKey.trim().length > 10) {
    try {
      const promptSeed = Math.floor(Math.random() * 100000);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are the chief psychological copywriter and creative director for SHOPY Atelier—an ultra-luxury fashion house.
Create a deeply psychological, hypnotic, and compelling quote and narrative that triggers customer desire, status affirmation, and insists on immediate purchase of luxury tailored garments.
Output ONLY strict JSON in this format:
{
  "headline": "Short uppercase magnetic headline (e.g. YOU DON'T DRESS TO BE NOTICED.)",
  "subHeadline": "Short uppercase punchy secondary headline (e.g. YOU DRESS TO BE IMPOSSIBLE TO FORGET.)",
  "quote": "A 1-2 sentence hypnotic psychological quote about why flawless attire commands instant authority, subconscious status, and emotional power.",
  "author": "SHOPY Atelier Philosophy or Luxury Sartorial Principle",
  "reflection": "A 2-3 sentence persuasive text that insists on buying now, explaining that standard is non-negotiable and settling for ordinary garments weakens personal leverage.",
  "theme": "The Psychology of Distinction",
  "ctaText": "Claim Your Signature Silhouette"
}`
            },
            {
              role: "user",
              content: `Generate a fresh, unique psychological buying-desire quote for a luxury shopper. Seed: ${promptSeed}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.9,
          max_tokens: 400,
        }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as EditorialQuote;
          if (parsed.quote && parsed.headline) {
            return {
              headline: parsed.headline.toUpperCase().trim(),
              subHeadline: parsed.subHeadline ? parsed.subHeadline.toUpperCase().trim() : undefined,
              quote: parsed.quote.trim(),
              author: parsed.author ? parsed.author.trim() : "Maison SHOPY Atelier",
              reflection: parsed.reflection ? parsed.reflection.trim() : "Refuse compromise. Elevate your presence today.",
              theme: parsed.theme ? parsed.theme.trim() : "The Psychology of Distinction",
              ctaText: parsed.ctaText ? parsed.ctaText.trim() : "Claim Your Signature Silhouette",
            };
          }
        }
      }
    } catch (error) {
      console.warn("Groq AI quote generation encountered an issue, falling back:", error);
    }
  }

  // 2. Try Gemini API if key is present
  if (geminiApiKey && geminiApiKey.trim().length > 10) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are the chief psychological copywriter for SHOPY Atelier luxury brand.
Generate a JSON object with keys:
"headline" (uppercase magnetic headline),
"subHeadline" (uppercase punchline),
"quote" (hypnotic psychological quote about why luxury clothes command subconscious authority),
"author" ("Maison SHOPY Atelier"),
"reflection" (persuasive paragraph insisting on buying and refusing compromise),
"theme" ("The Psychology of Distinction"),
"ctaText" ("Claim Your Signature Silhouette").
Return ONLY raw valid JSON.`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.9
          }
        }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText) as EditorialQuote;
          if (parsed.quote && parsed.headline) {
            return {
              headline: parsed.headline.toUpperCase().trim(),
              subHeadline: parsed.subHeadline?.toUpperCase().trim(),
              quote: parsed.quote.trim(),
              author: parsed.author || "Maison SHOPY Atelier",
              reflection: parsed.reflection || "Refuse compromise. Elevate your presence today.",
              theme: parsed.theme || "The Psychology of Distinction",
              ctaText: parsed.ctaText || "Claim Your Signature Silhouette",
            };
          }
        }
      }
    } catch (error) {
      console.warn("Gemini AI quote generation fallback:", error);
    }
  }

  // 3. Ultra-Diverse Dynamic Fallback Matrix
  return getRandomFallback();
}

function getRandomFallback(): EditorialQuote {
  const index = Math.floor(Math.random() * PSYCHOLOGICAL_EDITORIAL_QUOTES.length);
  return PSYCHOLOGICAL_EDITORIAL_QUOTES[index];
}
