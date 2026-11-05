# Go Offscript early-bird page

Live at `https://anisanorzri.github.io/offscript/` once this folder is on the `master` branch and GitHub Pages is on.

## Where the emails go

Sign-ups are saved to a Google Sheet you own. One-time setup (about 5 minutes):

1. Create a new Google Sheet, for example "Go Offscript sign-ups".
2. In the Sheet: **Extensions → Apps Script**. Delete what's there and paste in `google-sheet-script.gs` from this folder. Save.
3. **Deploy → New deployment → Select type: Web app.** Execute as: **Me**. Who has access: **Anyone**. Deploy, and allow the permissions it asks for.
4. Copy the **Web app URL** (it ends in `/exec`).
5. In `offscript/index.html`, set `const SHEET_URL='...';` to that URL.

Each sign-up adds a row to the `signups` tab: time, email, reservation code (`GOS-…`), consent, source. Duplicate emails are ignored, so it's one free week per email. To export, use File → Download → CSV.

Until `SHEET_URL` is set, the form tells visitors that sign-ups open soon and saves nothing.

## Example content

The tour (CVs, career paths, events, fellowships, mentors) uses example content written for the page. The hero picture is a real screen from the app.
