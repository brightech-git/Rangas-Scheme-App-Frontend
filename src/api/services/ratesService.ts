// src/api/services/ratesService.ts
//
// Live gold/silver rates (91.6% purity).
//   Today's rate : GET /api/v1/account/todayrate         -> { GOLDRATE, SILVERRATE }
//   History      : GET /api/v1/account/rate/history?METALID=G|S&PURITY=91.6
//                  -> [{ Date: "YYYY-MM-DD", Rate: number }]

import { callApi } from '../apiClient';
import { ACCOUNT } from '../endpoints';
import { RatesResponse, MetalRates, RateEntry } from '../../types/Rates/Rates';

const PURITY = '91.6';

interface TodayRate { GOLDRATE?: number; SILVERRATE?: number }
interface HistoryRow { Date: string; Rate: number }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(raw: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return raw;
  return `${m[3]} ${MONTHS[+m[2] - 1] ?? ''} ${m[1]}`;
}

// Build day-over-day entries (oldest first) from the raw history rows.
function buildEntries(rows: HistoryRow[]): RateEntry[] {
  const sorted = [...(rows ?? [])]
    .filter(r => r && r.Date != null)
    .sort((a, b) => String(a.Date).localeCompare(String(b.Date)));
  return sorted.map((r, i) => {
    const rate = Number(r.Rate) || 0;
    const prev = i > 0 ? (Number(sorted[i - 1].Rate) || rate) : rate;
    const change = rate - prev;
    const changePct = prev ? (change / prev) * 100 : 0;
    return { dateRaw: r.Date, date: fmtDate(r.Date), rate, change, changePct };
  });
}

function buildMetal(metal: 'Gold' | 'Silver', current: number | undefined, rows: HistoryRow[]): MetalRates {
  const history = buildEntries(rows);
  const last    = history[history.length - 1];
  const rate    = current ?? last?.rate ?? 0;
  return {
    metal,
    unit:        'per gram',
    purity:      '91.6%',
    currentRate: rate,
    change:      last?.change ?? 0,
    changePct:   last?.changePct ?? 0,
    updatedAt:   'Today',
    history,
  };
}

export const ratesService = {
  /** GET /api/v1/account/todayrate */
  getTodayRate: () =>
    callApi<null, TodayRate>({ method: 'get', url: ACCOUNT.TODAY_RATE }),

  /** GET /api/v1/account/rate/history?METALID=&PURITY= */
  getRateHistory: (metalId: 'G' | 'S', purity = PURITY) =>
    callApi<null, HistoryRow[]>({
      method: 'get',
      url:    ACCOUNT.RATE_HISTORY,
      params: { METALID: metalId, PURITY: purity },
    }),

  /** Combined today + history for both metals, in the RatesResponse shape. */
  getRates: async (_days = 10): Promise<RatesResponse> => {
    const [today, goldHist, silverHist] = await Promise.all([
      ratesService.getTodayRate().catch(() => ({} as TodayRate)),
      ratesService.getRateHistory('G').catch(() => [] as HistoryRow[]),
      ratesService.getRateHistory('S').catch(() => [] as HistoryRow[]),
    ]);
    return {
      gold:   buildMetal('Gold',   today?.GOLDRATE,   goldHist),
      silver: buildMetal('Silver', today?.SILVERRATE, silverHist),
    };
  },
};
