# Null Earth

Null Earth is a free-to-play browser geography guessing MVP. Players inspect one unsettling real-world Street View frame, place a guess on Google Maps, submit, and continue through endless session rounds.

## Requirements

- Node.js 20+
- Google Maps JavaScript API browser key
- Google Street View Static API server key

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the Google keys.

3. Start both the API and Vite client:

   ```bash
   npm run dev
   ```

The client runs on `http://127.0.0.1:5173` and the API runs on `http://127.0.0.1:8787`.

## Deploy on Vercel

1. Push this folder to GitHub.
2. Import the repo at `https://vercel.com/new`.
3. Use Vite defaults:
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`
4. Add environment variables:
   - `VITE_GOOGLE_MAPS_BROWSER_KEY`
   - `GOOGLE_STREETVIEW_SERVER_KEY`
   - `ROUND_SIGNING_SECRET`
5. Deploy.

After deploy, add `https://your-project.vercel.app/*` to the Google Maps browser key referrer restrictions.

## Scripts

- `npm run dev`: run client and API together.
- `npm run build`: type-check and build the client.
- `npm test`: run scoring and API behavior tests.
- `npm run harvest:deck`: harvest inactive Street View candidates into `server/data/locations.generated.json`.
- `npm run promote:reviewed`: activate reviewed generated locations after setting `REVIEWED_LOCATION_IDS` or `PROMOTE_ALL_REVIEWED_EMPTY=true`.

## Notes

- Coordinates are not returned when a round is created.
- Street View imagery is fetched through the API image endpoint.
- Session score and history live only in browser state.
- Generated deck entries start as `inactive` and `needs-review`; activate only after checking they contain no people.
