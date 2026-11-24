# Pi Lab

Responsive app (no build step). The pages are plain HTML/CSS/JS; the calculator's Π-group solver is Python, served by Django.

```
pip install -r backend/requirements.txt
python backend/manage.py migrate                 # once: creates the feedback database backend/db.sqlite3
python backend/manage.py runserver               # then open http://127.0.0.1:8000
python backend/manage.py test pigroups feedback accounts   # solver, feedback, sign-in and API tests
```

Without Django (`python -m http.server`) every page works except the calculator's **Calculate Π groups** button
and the **Feedback** form.

```
index.html            shell
css/                  tokens, components, home, guide, exercise
js/core/util.js       helpers + registries
js/components/        reusable widgets: symbol-keyboard.js (symbol keyboard)
js/templates/         layouts only: home.js, guide.js, exercise.js, calculator.js, feedback.js
js/activities/        interactive exercise types: sort, balance, crew, tuner, exponents, equation, tunnel
js/app.js             header + hash router + data loader
backend/              Django project: pilab_site/ (settings, urls) + pigroups/ (solver) + feedback/ (questionnaire)
                      + accounts/ (sign in with Google)
data/manifest.js      list of data files to load
data/shared.js        content shared by guides (repeating-variable guidelines)
data/home.js          home page content
data/keyboard.js      symbol keyboard keys (tabs > groups > [label, meaning, insert?])
data/symbols/*.js     variable symbols for the keyboard's Fluid mechanics and Heat transfer tabs,
                      one row each: [symbol, meaning, M, L, T, Θ]. Tapping one in the calculator
                      also fills in that row's M, L, T, Θ powers
data/guides/*.js      one file per guide example  -> PiLab.registerGuide({...})
data/exercises/*.js   one file per exercise       -> PiLab.registerExercise({...})
```

## Add a guide example
1. Copy `data/guides/wing-lift.js`, change `id`, `tabLabel`, problem, steps (blocks: p, note, equation, table, cells, repeating, exponents, results, similarity).
2. Add its path to `guides` in `data/manifest.js`. A new tab appears automatically.

## Add an exercise
1. Copy `data/exercises/sphere-drag.js` (or `radiator-heat.js` for a problem with temperature): edit `variables` (dim = [M,L,T] exponents, or set `dims: ['M','L','T','Θ']` and use 4 exponents; role dep/ind/out), `crew`, and the activity settings.
   Activity 4 can be `tuner` (sliders) or `exponents` (write and solve the power equation for each dimension).
2. Add its path to `exercises` in `data/manifest.js`.

New activity type: add `js/activities/<type>.js` calling `PiLab.registerActivity('<type>', ({cfg, ex, ui}) => ({mount, reset, hint, check}))` and a `<script>` tag in `index.html`.

## Symbol keyboard
`js/components/symbol-keyboard.js` + `css/keyboard.css` build an on-screen keyboard of fluid-mechanics and heat-transfer
symbols, Greek letters, powers/subscripts and operators. Keys live in `data/keyboard.js`. The calculator mounts it under the
variable table; to use it elsewhere: `PiLab.symbolKeyboard.mount(hostEl, { scope, targets: 'input.my-box' })`.

## Π-group solver (backend/pigroups)
Based on the algorithm in `BuckinghamPy-master/buckinghampy/buckinghampi.py` (MIT licence), rewritten with exact fractions
so it needs only Django (no numpy / scipy / sympy).

```
engine.py        dimension matrix, rank, exact solve, every valid repeating set, the working (power equation
                 for each dimension and the powers that solve them), clears fractional powers
named_groups.py  reads each variable as a physical kind (symbol + dimensions) and recognises ~30 named numbers:
                 Re, Ma, Fr, Eu, We, Sr, Ca, Bo, Ga, force/power/flow/head/torque coefficients, Pr, Nu, St, Pe,
                 Ec, Br, Gr, Ra, Fo, Ja, Sc, Le, βΔT … also inverses/powers (1/Re, Fr²) and products (Re·Pr)
service.py       request -> answer: validates the ticked repeating set (or picks the best one), and multiplies
                 groups together (Π₁ ÷ Π₄ …) to reach named numbers, e.g. Q/(kDΔT) = Nu
views.py         GET /  (page + CSRF cookie) · POST /api/pi-groups/ · GET /api/named-groups/
```

`POST /api/pi-groups/` body: `{"dependent": 0, "variables": [{"name": "ρ", "dims": [1,-3,0,0], "repeating": true}, …]}`
(dims = powers of M, L, T, Θ; `dependent` is a row index or null; tick no `repeating` to let the solver choose).
Errors come back as `{"ok": false, "error": "…"}` with status 400, worded for the student.
Add a named number: append it to `NAMED` in `named_groups.py` (and any new kind to `KINDS`).

For a public deployment set `PILAB_SECRET_KEY`, `PILAB_DEBUG=0`, `PILAB_ALLOWED_HOSTS`, and let the web server serve
`css/`, `js/` and `data/` directly.

## Feedback questionnaire (backend/feedback)
The **Feedback** page (`#/feedback`) first asks people to **sign in with Google** (one response per Google account;
the email is saved with the answers). Then it asks for name (pre-filled from Google) and occupation, then:

| Section | What it measures | Items |
|---|---|---|
| A About you | name, occupation, field, prior knowledge, parts of Pi Lab used | 5 |
| B Ease of use | System Usability Scale (SUS1–SUS10), scored 0–100 (≈68 is average) | 10 |
| C Learning | perceived learning and usefulness of guide, exercises, calculator (L1–L8) | 8 |
| D Engagement | interest, design, clarity, device, preference (E1–E5), overall rating, recommend 0–10 (NPS) | 7 |
| E Comments | liked most, improvements, problems (optional) | 3 |

```
questions.py   every question (wording, type, column code), SUS scoring. Edit wording here only.
validate.py    checks a submitted form; errors are worded for the person filling it in
models.py      Response: submitted time, Google user + email (unique: one per account), name, occupation,
               answers (JSON by code), SUS score
views.py       GET /api/feedback/questions/ · POST /api/feedback/ · GET /api/feedback/export.xlsx|.csv (staff only)
admin.py       /admin/: list, search and filter responses; download all or the ticked ones
export.py      .xlsx (no extra package) with sheets Responses, Summary (means, SD, % agree, SUS, NPS), Questions; or .csv
```

Read and download the responses:
1. `python backend/manage.py createsuperuser` (once) to make your admin login.
2. Open http://127.0.0.1:8000/admin/ > Feedback responses > **Download all as Excel (.xlsx)**.
   Or from the terminal: `python backend/manage.py export_feedback` (or `export_feedback results.csv`).

`backend/db.sqlite3` holds people's names: keep it private and do not share or upload it with the code.

## Google sign-in (backend/accounts)
Uses Google's OAuth 2.0 / OpenID Connect code flow with the standard library only (no extra package).
The **Sign in with Google** button sits in the header; the feedback form requires it.

One-time setup in [Google Cloud Console](https://console.cloud.google.com/):
1. Create a project (or pick one). **APIs & Services > OAuth consent screen**: User type **External**, fill in the
   app name and your email, scopes `openid`, `email`, `profile` (the defaults; no verification needed).
2. While the app is in **Testing**, only the emails listed under *Test users* can sign in (up to 100). To let anyone
   with a Google account respond, press **Publish app**.
3. **APIs & Services > Credentials > Create credentials > OAuth client ID**, type **Web application**.
   Authorised redirect URIs (exactly, with the final slash):
   `http://127.0.0.1:8000/auth/google/callback/` and `http://localhost:8000/auth/google/callback/`
   (for a public site add `https://your-domain/auth/google/callback/`).
4. Press **Download JSON** and save the file as `backend/google_oauth.json`
   (or set `PILAB_GOOGLE_CLIENT_ID` and `PILAB_GOOGLE_CLIENT_SECRET`). Restart the server.

`backend/google_oauth.json` holds a secret: keep it private, like `db.sqlite3`.
Each Google account becomes a Django user named `google:<id>`; they can never log in to /admin/.

## Put Pi Lab online with Render + Neon (free)
Render runs the site from GitHub; Neon keeps the feedback in PostgreSQL (Render's free disk is wiped on restart,
and its free database expires after 30 days). Files: `render.yaml` (the Render setup), `build.sh` (runs on deploy).

1. **Neon** (neon.tech): sign up, create a project (region: Singapore / AWS ap-southeast-1), copy the
   **connection string** (`postgresql://…?sslmode=require`).
2. **Render** (render.com): sign up with GitHub, **New > Blueprint**, pick `MLFTech/PI-LAB-APP`. Fill in the asked values:
   `DATABASE_URL` (Neon string), `PILAB_GOOGLE_CLIENT_ID` / `PILAB_GOOGLE_CLIENT_SECRET` (from google_oauth.json),
   `PILAB_ADMIN_USERNAME` / `_EMAIL` / `_PASSWORD` (your /admin/ login, password 12+ characters), `PILAB_CONTACT_EMAIL`.
   Deploy. The site is at `https://pi-lab.onrender.com` (or the name Render shows).
3. **Google Cloud Console**: add `https://YOUR-SITE.onrender.com/auth/google/callback/` to the client's redirect URIs;
   Branding: home page `https://YOUR-SITE.onrender.com/`, privacy `https://YOUR-SITE.onrender.com/privacy/`,
   authorised domain `YOUR-SITE.onrender.com`; then Audience > Publish app.

Every `git push` to `main` redeploys automatically. Free Render sites sleep after 15 minutes without visitors;
the next visit takes up to about a minute to wake it.

## Put Pi Lab online (PythonAnywhere, free)
1. `python backend/make_upload_zip.py` makes `pilab-upload.zip` on the Desktop (no database, no Google secret).
2. Sign up at pythonanywhere.com (free "Beginner" account). Your site will be `https://USERNAME.pythonanywhere.com`.
3. **Files** tab: upload the zip. **Consoles > Bash**:
   ```
   unzip pilab-upload.zip
   mkvirtualenv --python=python3.13 pilab        # newest Python offered; Django 5.2 is chosen automatically on older ones
   pip install -r pilab/backend/requirements.txt
   ```
4. **Web** tab > Add a new web app > *Manual configuration* > same Python version. Then set
   *Virtualenv* `/home/USERNAME/.virtualenvs/pilab`, *Source code* `/home/USERNAME/pilab`, turn on *Force HTTPS*,
   and replace the WSGI file with:
   ```python
   import os, sys
   sys.path.insert(0, '/home/USERNAME/pilab/backend')
   os.environ['DJANGO_SETTINGS_MODULE'] = 'pilab_site.settings'
   os.environ['PILAB_DEBUG'] = '0'
   os.environ['PILAB_SECRET_KEY'] = 'PASTE-A-LONG-RANDOM-KEY'
   os.environ['PILAB_ALLOWED_HOSTS'] = 'USERNAME.pythonanywhere.com'
   os.environ['PILAB_GOOGLE_REDIRECT_URI'] = 'https://USERNAME.pythonanywhere.com/auth/google/callback/'
   os.environ['PILAB_CONTACT_EMAIL'] = 'you@example.com'      # shown on /privacy/
   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```
   Make a key with `python -c "import secrets; print(secrets.token_urlsafe(50))"`.
5. Back in the Bash console (same variables as the WSGI file, for these commands):
   ```
   cd ~/pilab
   export PILAB_DEBUG=0 PILAB_SECRET_KEY=same-key PILAB_ALLOWED_HOSTS=USERNAME.pythonanywhere.com
   python backend/manage.py migrate
   python backend/manage.py collectstatic --noinput
   python backend/manage.py createsuperuser
   ```
6. **Web** tab > Static files: URL `/static/` -> `/home/USERNAME/pilab/backend/staticfiles`.
7. Upload `backend/google_oauth.json` (Files tab) into `/home/USERNAME/pilab/backend/`, then press **Reload**.
8. Google Cloud Console: add `https://USERNAME.pythonanywhere.com/auth/google/callback/` to the OAuth client's
   redirect URIs; Branding: home page `https://USERNAME.pythonanywhere.com/`, privacy policy
   `https://USERNAME.pythonanywhere.com/privacy/`, authorised domain `USERNAME.pythonanywhere.com`. Then Audience > Publish app.

To update the site later: make a new zip, upload, `unzip -o pilab-upload.zip`, then Reload on the Web tab.
The online database is separate from the one on your computer; download responses from the online /admin/.
