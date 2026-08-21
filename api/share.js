// =============================================================
// 카톡/SNS 링크 미리보기용 — 레시피별 Open Graph 카드 생성
// /recipe/share/:slug 요청을 이 함수로 rewrite → 레시피 정보를
// 읽어 og 태그를 심은 index.html(SPA)을 그대로 돌려준다.
// 실제 사용자는 SPA가 그려주고, 미리보기 로봇은 og 태그를 읽는다.
// =============================================================
const SUPA = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, ' ');
}

export default async function handler(req, res) {
  const slug = String((req.query && req.query.slug) || '').trim();

  let recipe = null;
  try {
    if (SUPA && KEY && slug) {
      const r = await fetch(`${SUPA}/rest/v1/rpc/get_shared_recipe`, {
        method: 'POST',
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_slug: slug }),
      });
      if (r.ok) {
        const d = await r.json();
        if (d && d.title) recipe = d;
      }
    }
  } catch (_) {}

  const host = req.headers.host;
  const base = `https://${host}`;
  let html = '';
  try {
    html = await fetch(`${base}/index.html`).then((r) => r.text());
  } catch (_) {
    html =
      '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>';
  }

  const title = recipe ? `${recipe.title} · 끼니` : '끼니 — 레시피 공유';
  const desc = recipe
    ? recipe.summary || `${recipe.title} 레시피를 확인해보세요`
    : '나만의 끼니를 기록하다';
  const img = recipe && recipe.cover_image_url ? recipe.cover_image_url : '';
  const url = `${base}/recipe/share/${encodeURIComponent(slug)}`;

  let og =
    `\n<meta property="og:type" content="article">` +
    `\n<meta property="og:site_name" content="끼니">` +
    `\n<meta property="og:title" content="${esc(title)}">` +
    `\n<meta property="og:description" content="${esc(desc)}">` +
    `\n<meta property="og:url" content="${esc(url)}">` +
    `\n<meta name="twitter:title" content="${esc(title)}">` +
    `\n<meta name="twitter:description" content="${esc(desc)}">` +
    `\n<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`;
  if (img) {
    og +=
      `\n<meta property="og:image" content="${esc(img)}">` +
      `\n<meta name="twitter:image" content="${esc(img)}">`;
  }

  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${esc(title)}</title>`,
  );
  html = html.includes('</head>')
    ? html.replace('</head>', `${og}\n</head>`)
    : html + og;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
}
