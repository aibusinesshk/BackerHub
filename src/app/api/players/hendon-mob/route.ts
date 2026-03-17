import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

interface HendonMobData {
  totalEarnings: number;
  bestCash: number;
  allTimeRank: number | null;
  countryRank: number | null;
  recentResults: Array<{
    tournament: string;
    place: string;
    prize: number;
    date: string;
  }>;
  name: string;
  country: string;
}

// Extract data from a Hendon Mob profile URL using Tavily
async function extractHendonMobProfile(url: string): Promise<HendonMobData | null> {
  if (!TAVILY_API_KEY) throw new Error('TAVILY_API_KEY not configured');

  // Use Tavily extract to get the page content
  const res = await fetch('https://api.tavily.com/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      urls: [url],
    }),
  });

  if (!res.ok) {
    // Fallback to search if extract fails
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `site:thehendonmob.com ${url.split('/').pop()} poker player statistics earnings`,
        search_depth: 'advanced',
        max_results: 3,
        include_answer: true,
        include_raw_content: true,
      }),
    });
    if (!searchRes.ok) throw new Error(`Tavily search failed: ${searchRes.status}`);
    const searchData = await searchRes.json();

    // Parse from search results
    return parseHendonMobFromSearch(searchData);
  }

  const data = await res.json();
  if (!data.results?.length) return null;

  return parseHendonMobContent(data.results[0].raw_content || data.results[0].content || '');
}

function parseHendonMobContent(content: string): HendonMobData {
  const result: HendonMobData = {
    totalEarnings: 0,
    bestCash: 0,
    allTimeRank: null,
    countryRank: null,
    recentResults: [],
    name: '',
    country: '',
  };

  // Parse total earnings: "Total Live Earnings $1,433,456"
  const earningsMatch = content.match(/Total Live Earnings\s*\$?([\d,]+)/i);
  if (earningsMatch) result.totalEarnings = parseInt(earningsMatch[1].replace(/,/g, ''));

  // Parse best cash: "Best Live Cash $114,935"
  const bestMatch = content.match(/Best Live Cash\s*\$?([\d,]+)/i);
  if (bestMatch) result.bestCash = parseInt(bestMatch[1].replace(/,/g, ''));

  // Parse all time rank: "All Time Money List 2,502nd"
  const rankMatch = content.match(/All Time Money List\s*([\d,]+)/i);
  if (rankMatch) result.allTimeRank = parseInt(rankMatch[1].replace(/,/g, ''));

  // Parse name from page
  const nameMatch = content.match(/(?:^|\n)\s*([A-Z][a-z]+(?: [A-Z][a-z]+)+)\s*(?:\n|$)/m);
  if (nameMatch) result.name = nameMatch[1].trim();

  // Parse nationality
  const countryMatch = content.match(/Nationality:\s*(\w+(?:\s\w+)*)/i);
  if (countryMatch) result.country = countryMatch[1].trim();

  // Parse recent results from tables
  const resultPattern = /(\d{1,2}(?:st|nd|rd|th))\s+.*?\$?([\d,]+)/gi;
  let match;
  while ((match = resultPattern.exec(content)) !== null && result.recentResults.length < 10) {
    result.recentResults.push({
      tournament: 'Recent event',
      place: match[1],
      prize: parseInt(match[2].replace(/,/g, '')),
      date: '',
    });
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseHendonMobFromSearch(searchData: any): HendonMobData {
  const result: HendonMobData = {
    totalEarnings: 0,
    bestCash: 0,
    allTimeRank: null,
    countryRank: null,
    recentResults: [],
    name: '',
    country: '',
  };

  const allContent = [
    searchData.answer || '',
    ...(searchData.results || []).map((r: { content: string }) => r.content),
  ].join('\n');

  // Parse from combined content
  const earningsMatch = allContent.match(/Total Live Earnings\s*\$?([\d,]+)/i)
    || allContent.match(/live earnings[^$]*\$?([\d,]+(?:,\d{3})*)/i)
    || allContent.match(/\$([\d,]+(?:,\d{3})*)\s*(?:in\s+)?(?:total\s+)?(?:live\s+)?earnings/i);
  if (earningsMatch) result.totalEarnings = parseInt(earningsMatch[1].replace(/,/g, ''));

  const bestMatch = allContent.match(/Best Live Cash\s*\$?([\d,]+)/i)
    || allContent.match(/best.*?cash.*?\$?([\d,]+(?:,\d{3})*)/i);
  if (bestMatch) result.bestCash = parseInt(bestMatch[1].replace(/,/g, ''));

  const rankMatch = allContent.match(/All Time Money List\s*([\d,]+)/i);
  if (rankMatch) result.allTimeRank = parseInt(rankMatch[1].replace(/,/g, ''));

  // Try to get name from title of first result
  if (searchData.results?.[0]?.title) {
    const title = searchData.results[0].title;
    const nm = title.match(/^([A-Z][a-z]+(?: [A-Z][a-z]+)+)/);
    if (nm) result.name = nm[1];
  }

  const countryMatch = allContent.match(/Nationality:\s*(\w+(?:\s\w+)*)/i)
    || allContent.match(/(?:from|based in|country:)\s*(\w+(?:\s\w+)*)/i);
  if (countryMatch) result.country = countryMatch[1].trim();

  return result;
}

// POST /api/players/hendon-mob — Extract and update player stats from Hendon Mob
export async function POST(request: Request) {
  if (!TAVILY_API_KEY) {
    return NextResponse.json({ error: 'TAVILY_API_KEY not configured' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { hendonMobUrl } = body;

  if (!hendonMobUrl || !hendonMobUrl.includes('thehendonmob.com')) {
    return NextResponse.json({ error: 'Invalid Hendon Mob URL. Must be from thehendonmob.com' }, { status: 400 });
  }

  try {
    const data = await extractHendonMobProfile(hendonMobUrl);
    if (!data) {
      return NextResponse.json({ error: 'Could not extract data from Hendon Mob profile' }, { status: 404 });
    }

    // Update player stats in database
    const statsUpdate: Record<string, unknown> = {};
    if (data.totalEarnings > 0) statsUpdate.total_staked_value = data.totalEarnings;
    if (data.bestCash > 0) statsUpdate.biggest_win = data.bestCash;

    if (Object.keys(statsUpdate).length > 0) {
      statsUpdate.updated_at = new Date().toISOString();
      await (supabase.from('player_stats') as ReturnType<typeof supabase.from>)
        .update(statsUpdate)
        .eq('player_id', user.id);
    }

    // Store Hendon Mob URL in dedicated column
    await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
      .update({ hendon_mob_url: hendonMobUrl })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      extracted: {
        name: data.name,
        country: data.country,
        totalEarnings: data.totalEarnings,
        bestCash: data.bestCash,
        allTimeRank: data.allTimeRank,
        recentResults: data.recentResults.length,
      },
      statsUpdated: Object.keys(statsUpdate).length > 0,
    });
  } catch (err) {
    return NextResponse.json({
      error: `Failed to extract data: ${err instanceof Error ? err.message : String(err)}`,
    }, { status: 500 });
  }
}
