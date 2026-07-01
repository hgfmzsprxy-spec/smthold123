# Debug Session: loader-launch-blocked
- **Status**: [OPEN]
- **Issue**: Klikniecie `LAUNCH` na `https://unbanhwid.com/loader` zwraca `Failed to fetch`, a DevTools pokazuje `POST http://127.0.0.1:38491/launch net::ERR_BLOCKED_BY_CLIENT` mimo uruchomionego `loader.exe`.
- **Debug Server**: http://127.0.0.1:17778/event
- **Log File**: `.dbg/trae-debug-log-loader-launch-blocked.ndjson`

## Reproduction Steps
1. Uruchom `loader.exe`.
2. Poczekaj na komunikat `Waiting for Loader launch`.
3. Otworz `https://unbanhwid.com/loader`.
4. Kliknij `LAUNCH`.
5. Zobacz blad `Loader not detected` i `Failed to fetch`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Request do `127.0.0.1:38491` jest blokowany przez rozszerzenie/adblock/privacy shield zanim wyjdzie z przegladarki. | High | Low | Confirmed by browser runtime evidence |
| B | Strona nie probuje wyslac requestu z poprawnym URL/metoda/body w runtime mimo poprawnego kodu statycznego. | Medium | Low | Rejected by DevTools stack and fetch call path |
| C | Przegladarka blokuje lokalny request z powodu polityki Private Network Access / CORS / mixed-context jeszcze przed dotarciem do loadera. | Medium | Low | Pending |
| D | Inny proces lub filtr systemowy przejmuje/blokuje port `38491`, a przegladarka raportuje to mylaco jako `ERR_BLOCKED_BY_CLIENT`. | Low | Medium | Unlikely |

## Log Evidence
- User runtime evidence: `POST http://127.0.0.1:38491/launch net::ERR_BLOCKED_BY_CLIENT` in DevTools at `triggerLocalLoaderLaunch`.
- This confirms the request is blocked in the browser layer before loader bridge handles it.
- Added browser-side instrumentation around `fetch` in `loader/index.html` and a local fallback debug collector in `.dbg/debug-server-loader-launch-blocked.js`.

## Verification Conclusion
- Implemented mitigation: frontend now tries multiple bridge URLs including a new non-`/launch` route (`/loader-sync`) on both `127.0.0.1` and `localhost`, and the native loader bridge now accepts both `/launch` and `/loader-sync`.
- Awaiting rebuild/redeploy and user verification.
