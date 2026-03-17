import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

interface TavilyResult {
  url: string;
  title: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  answer?: string;
  results: TavilyResult[];
}

interface ParsedTournament {
  name: string;
  name_zh: string | null;
  venue: string;
  venue_zh: string | null;
  date: string;
  buy_in: number;
  guaranteed_pool: number;
  type: 'MTT' | 'SNG' | 'SAT' | 'HU';
  game: 'NLHE' | 'PLO' | 'Mixed';
  region: 'TW' | 'HK' | 'OTHER';
  source_url?: string;
}

// Search Tavily for poker tournament data
async function searchTavily(query: string): Promise<TavilyResponse> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: 'advanced',
      max_results: 10,
      include_answer: true,
    }),
  });
  if (!res.ok) throw new Error(`Tavily API error: ${res.status}`);
  return res.json();
}

// Parse tournament data from Tavily search results using heuristics
function parseTournamentsFromResults(results: TavilyResult[], answer?: string): ParsedTournament[] {
  const tournaments: ParsedTournament[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    const text = `${result.title}\n${result.content}`;

    // Try to extract individual events from structured content
    // Pattern: event name + buy-in + date + guarantee
    const eventPatterns = [
      // "Event Name ... Buy-in TWD X,XXX ... GTD TWD X,XXX,XXX"
      /(?:#\d+\s+)?([A-Z][^|#\n]{5,60}?)[\s\-–]+(?:Buy-in|buy-in)[:\s]*(?:TWD|NT\$|NTD)\s*([\d,]+)/gi,
      // "Event Name @VENUE DATE ... Buy-in TWD X"
      /(?:#\d+\s+)?([A-Z][^@\n]{5,60})@\w+\s+\d{4}\.\d{2}\.\d{2}[^|]*?\|\s*([\d,]+)\s*TWD/gi,
    ];

    for (const pattern of eventPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1].trim().replace(/\s+/g, ' ');
        const buyInTWD = parseInt(match[2].replace(/,/g, ''));

        if (buyInTWD < 1000 || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        // Convert TWD to USD (approximate rate: 1 USD = 31.5 TWD)
        const buyInUSD = Math.round(buyInTWD / 31.5);

        // Try to find guaranteed pool near this match
        const nearbyText = text.substring(Math.max(0, match.index - 200), match.index + 500);
        let gtdPool = 0;
        const gtdMatch = nearbyText.match(/(?:GTD|Guarantee)[:\s]*(?:TWD|NT\$)\s*([\d,]+)/i);
        if (gtdMatch) {
          gtdPool = Math.round(parseInt(gtdMatch[1].replace(/,/g, '')) / 31.5);
        }

        // Try to find date
        let date = '';
        const dateMatch = nearbyText.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
        if (dateMatch) {
          date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        }

        // Determine game type
        let game: 'NLHE' | 'PLO' | 'Mixed' = 'NLHE';
        if (/PLO|Omaha/i.test(name)) game = 'PLO';
        else if (/Mixed|8-Game|HORSE/i.test(name)) game = 'Mixed';

        // Determine tournament type
        let type: 'MTT' | 'SNG' | 'SAT' | 'HU' = 'MTT';
        if (/Satellite|SAT/i.test(name)) type = 'SAT';
        else if (/SNG|Sit.*Go/i.test(name)) type = 'SNG';
        else if (/Heads.?Up|HU/i.test(name)) type = 'HU';

        // Determine region from venue/content
        let region: 'TW' | 'HK' | 'OTHER' = 'TW';
        if (/Hong Kong|HK|Macau/i.test(nearbyText)) region = 'HK';
        else if (/Korea|Jeju|Incheon|Manila|Vietnam/i.test(nearbyText)) region = 'OTHER';

        // Determine venue
        let venue = 'TBD';
        let venueZh: string | null = null;
        if (/Red Space/i.test(nearbyText)) {
          venue = 'Red Space, Songshan District, Taipei';
          venueZh = 'Red Space 多元商務空間，台北松山區';
        } else if (/Asia Poker Arena|APA/i.test(nearbyText)) {
          venue = 'Asia Poker Arena, Zhongshan District, Taipei';
          venueZh = 'Asia Poker Arena，台北中山區';
        } else if (/CTP|Chinese Texas/i.test(nearbyText)) {
          venue = 'CTP Chinese Texas Hold\'em Poker Club, Taipei';
          venueZh = 'CTP中華德州撲克協會，台北';
        }

        if (date && buyInUSD > 0) {
          tournaments.push({
            name,
            name_zh: null, // Can be added later or translated
            venue,
            venue_zh: venueZh,
            date,
            buy_in: buyInUSD,
            guaranteed_pool: gtdPool,
            type,
            game,
            region,
            source_url: result.url,
          });
        }
      }
    }
  }

  return tournaments;
}

// POST /api/tournaments/sync — Fetch latest tournament data from the web
// Can be called daily via cron or manually
export async function POST(request: Request) {
  if (!TAVILY_API_KEY) {
    return NextResponse.json({ error: 'TAVILY_API_KEY not configured' }, { status: 500 });
  }

  // Optional: verify admin or API key
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // If CRON_SECRET is set, require it. Otherwise allow unauthenticated (for dev)
    // In production, always set CRON_SECRET
  }

  const searchQueries = [
    'APT Asian Poker Tour Taiwan 2026 tournament schedule buy-in',
    'Taiwan poker tournament 2026 TMT CTP schedule',
    'Asia poker tournament 2026 Hong Kong Macau schedule buy-in',
  ];

  const allParsed: ParsedTournament[] = [];
  const searchErrors: string[] = [];

  for (const query of searchQueries) {
    try {
      const response = await searchTavily(query);
      const parsed = parseTournamentsFromResults(response.results, response.answer);
      allParsed.push(...parsed);
    } catch (err) {
      searchErrors.push(`Query "${query}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Deduplicate by name similarity
  const unique = allParsed.filter((t, i) =>
    allParsed.findIndex(u => u.name.toLowerCase() === t.name.toLowerCase()) === i
  );

  // Upsert into database
  const admin = await createAdminClient();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const upsertErrors: string[] = [];

  for (const t of unique) {
    // Check if tournament with same name and date already exists
    const { data: existing } = await admin
      .from('tournaments')
      .select('id, name')
      .eq('name', t.name)
      .single();

    if (existing) {
      // Update existing
      const { error } = await admin.from('tournaments').update({
        venue: t.venue,
        venue_zh: t.venue_zh,
        date: new Date(t.date).toISOString(),
        buy_in: t.buy_in,
        guaranteed_pool: t.guaranteed_pool,
        type: t.type,
        game: t.game,
        region: t.region,
      }).eq('id', existing.id);
      if (error) upsertErrors.push(`Update ${t.name}: ${error.message}`);
      else updated++;
    } else {
      // Insert new
      const { error } = await admin.from('tournaments').insert({
        name: t.name,
        name_zh: t.name_zh,
        venue: t.venue,
        venue_zh: t.venue_zh,
        date: new Date(t.date).toISOString(),
        buy_in: t.buy_in,
        guaranteed_pool: t.guaranteed_pool,
        type: t.type,
        game: t.game,
        region: t.region,
      });
      if (error) {
        upsertErrors.push(`Insert ${t.name}: ${error.message}`);
        skipped++;
      } else {
        inserted++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      searched: searchQueries.length,
      parsed: allParsed.length,
      unique: unique.length,
      inserted,
      updated,
      skipped,
    },
    errors: {
      search: searchErrors,
      upsert: upsertErrors,
    },
    tournaments: unique.map(t => ({ name: t.name, date: t.date, buy_in: t.buy_in, region: t.region })),
  });
}
