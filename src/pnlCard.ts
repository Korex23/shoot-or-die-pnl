export type PnlCardPayload = {
  pnl: number;
  pnlPercent: number;
  stake: number;
  username: string;
};

const TWITTER_HANDLE = "@Debonk_SD";
const GAME_URL = "t.me/shootordiebot/sord";

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "+";
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(2)}k`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getPnlCardCaption({ pnl, pnlPercent }: PnlCardPayload): string {
  const isWin = pnl >= 0;
  return isWin
    ? `MISSION SUCCESS on Shoot or Die!\n${formatCurrency(pnl)} (${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(1)}%)\n\nThink you can do better?\n${GAME_URL}`
    : `K.I.A. on Shoot or Die\n${formatCurrency(pnl)} (${pnlPercent.toFixed(1)}%)\n\nRevenge trade?\n${GAME_URL}`;
}

export function renderPnlCardHtmlDocument({ pnl, pnlPercent, stake, username }: PnlCardPayload): string {
  const isWin = pnl >= 0;
  const gold = "#c9a34a";
  const red = "#ef4444";
  const accent = isWin ? gold : red;
  const multiplier = stake > 0 ? ((stake + pnl) / stake).toFixed(2) : "1.00";
  const safeUsername = escapeHtml(username);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
    <style>
      html, body { margin: 0; padding: 0; background: #080808; }
      body { min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 16px; box-sizing: border-box; }
      *, *::before, *::after { box-sizing: border-box; }
    </style>
  </head>
  <body>
    <div id="card-root" style="background:#0c0b09;border:1px solid ${accent}80;position:relative;font-family:'Space Grotesk','Segoe UI',sans-serif;padding:32px 28px 40px;width:360px;clip-path:polygon(0 0,95% 0,100% 5%,100% 100%,5% 100%,0 95%);">
      <div style="position:absolute;inset:0;background-image:radial-gradient(${accent} 0.5px, transparent 0.5px);background-size:30px 30px;opacity:0.06;pointer-events:none;"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 50%, rgba(8,8,8,0.7) 100%);pointer-events:none;"></div>
      <div style="position:absolute;top:0;left:0;width:40px;height:40px;border-top:2px solid ${accent};border-left:2px solid ${accent};"></div>
      <div style="position:absolute;bottom:0;right:0;width:40px;height:40px;border-bottom:2px solid ${accent};border-right:2px solid ${accent};"></div>
      <div style="position:absolute;top:12px;left:12px;font-size:8px;font-family:monospace;color:${accent}80;letter-spacing:0.1em;">SYS.INIT.LOG_12</div>
      <div style="position:relative;z-index:10;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;margin-top:8px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:6px;height:6px;border-radius:50%;background:${accent};flex-shrink:0;"></div>
            <span style="font-size:9px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:${accent};">LIVE TRANSMISSION</span>
          </div>
          <span style="font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#9a8f7e55;">ID: #8829-X</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <svg width="22" height="22" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
            <path d="M3.8078 5.59406C3.75666 5.79273 3.72937 6.00099 3.72937 6.21562C3.72937 6.43025 3.75666 6.63851 3.8078 6.83718H0V5.59406H3.8078Z" fill="${accent}" />
            <path d="M12.4312 6.83718H8.62345C8.67458 6.63851 8.70187 6.43025 8.70187 6.21562C8.70187 6.00099 8.67458 5.79273 8.62345 5.59406H12.4312V6.83718Z" fill="${accent}" />
            <path d="M6.83718 12.4312H5.59406V8.62345C5.79273 8.67458 6.00099 8.70187 6.21562 8.70187C6.43025 8.70187 6.63851 8.67458 6.83718 8.62345V12.4312Z" fill="${accent}" />
            <path d="M6.83718 3.80767C6.63852 3.75654 6.43024 3.72937 6.21562 3.72937C6.001 3.72937 5.79272 3.75654 5.59406 3.80767V0H6.83718V3.80767Z" fill="${accent}" />
            <path d="M2.66628 7.42645C3.04082 8.48604 3.88051 9.32559 4.94008 9.70013V10.9991C3.19275 10.5494 1.81718 9.17378 1.36744 7.42645H2.66628Z" fill="${accent}" />
            <path d="M10.999 7.42645C10.5492 9.17378 9.17366 10.5494 7.42633 10.9991V9.70013C8.48591 9.32559 9.3256 8.48604 9.70013 7.42645H10.999Z" fill="${accent}" />
            <path d="M4.94008 2.6664C3.88049 3.04094 3.04082 3.88061 2.66628 4.9402H1.36744C1.81718 3.19286 3.19274 1.81717 4.94008 1.36744V2.6664Z" fill="${accent}" />
            <path d="M7.42633 1.36744C9.17368 1.81717 10.5492 3.19286 10.999 4.9402H9.70013C9.32559 3.88061 8.48593 3.04094 7.42633 2.6664V1.36744Z" fill="${accent}" />
          </svg>
          <div style="font-size:22px;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-0.03em;color:${accent};line-height:1;">Shoot or Die</div>
        </div>
        <div style="font-size:36px;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-0.04em;line-height:0.95;color:${isWin ? "#eae1d7" : red};margin-bottom:10px;">${isWin ? "MISSION<br />SUCCESS" : "K.I.A."}</div>
        <div style="border-left:3px solid ${accent};padding-left:10px;margin-bottom:8px;">
          <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#eae1d7;">${safeUsername}</div>
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:${gold}BB;">ARENA OPERATIVE</div>
        </div>
        <div style="text-align:center;padding-bottom:12px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.35em;color:${accent};margin-bottom:8px;">${isWin ? "PROFIT YIELD" : "CAPITAL DRAIN"}</div>
          <div style="font-size:44px;font-weight:900;font-style:italic;letter-spacing:-0.04em;color:${accent};line-height:1;margin-bottom:14px;">${escapeHtml(formatCurrency(pnl))}</div>
          <div style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:4px 12px;background:${isWin ? "rgba(201,163,74,0.20)" : "rgba(220,50,50,0.20)"};border:1px solid ${isWin ? "rgba(201,163,74,0.5)" : "rgba(220,50,50,0.5)"};border-radius:6px;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:${accent};white-space:nowrap;">${isWin ? "▲" : "▼"} ${Math.abs(pnlPercent).toFixed(1)}% ${isWin ? "ALPHA SECURED" : "CRITICAL LOSS"}</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid ${accent}33;border-bottom:1px solid ${accent}33;padding:14px 0;margin-bottom:20px;">
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;border-right:1px solid ${accent}22;padding:0 6px;">
            <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9a8f7e55;margin-bottom:5px;">ENTRY STAKE</div>
            <div style="font-size:12px;font-weight:700;font-family:monospace;color:#eae1d7;">${escapeHtml(formatCurrency(stake))}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;border-right:1px solid ${accent}22;padding:0 6px;">
            <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9a8f7e55;margin-bottom:5px;">EXIT MULTI</div>
            <div style="font-size:12px;font-weight:700;font-family:monospace;color:${accent};">${multiplier}X</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 6px;">
            <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9a8f7e55;margin-bottom:5px;">PLATFORM</div>
            <div style="font-size:12px;font-weight:700;font-family:monospace;color:#eae1d7;">DEBONK</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#9a8f7e88;margin-bottom:4px;">JOIN THE ARENA</div>
            <div style="font-size:13px;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:0.08em;color:${accent};">${GAME_URL}</div>
          </div>
          <div style="text-align:right;max-width:130px;">
            <div style="font-size:6px;text-transform:uppercase;color:#9a8f7e55;line-height:1.6;">PRECISION TRADING PLATFORM. REWARDS ARE FOR THE SWIFT.</div>
            <div style="font-size:9px;font-weight:700;color:${accent}88;margin-top:4px;font-family:monospace;text-align:right;">${TWITTER_HANDLE}</div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}
