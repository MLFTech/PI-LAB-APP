# BuckinghamEdu

Responsive app (no build step). The pages are plain HTML/CSS/JS; the calculator's Π-group solver and AI variable
extractor are Python, served by Django. No database.

```
pip install -r backend/requirements.txt
python backend/manage.py runserver           # then open http://127.0.0.1:8000
python backend/manage.py test pigroups       # solver, extractor and API tests (no API key or cost needed)
```

The AI variable extractor needs an Anthropic API key (console.anthropic.com > API keys) in the environment:
`$env:ANTHROPIC_API_KEY = "sk-ant-..."` (PowerShell) before `runserver`. Without it, everything else works and the
extractor says it is not set up. Without Django (`python -m http.server`) every page works except the calculator's
**Extract variables** and **Calculate Π groups** buttons.

```
index.html            shell
css/                  tokens, components, home, guide, exercise, calculator, keyboard, feedback
img/logo.svg          the logo (header and browser tab)
js/core/util.js       helpers + registries
js/components/        reusable widgets: symbol-keyboard.js (symbol keyboard)
js/templates/         layouts only: home.js, guide.js, exercise.js, calculator.js, feedback.js
js/activities/        interactive exercise types: sort, balance, crew, tuner, exponents, equation, tunnel
js/app.js             header + hash router + data loader
backend/              Django project: pilab_site/ (settings, urls) + pigroups/ (solver + AI extractor)
data/manifest.js      list of data files to load
data/shared.js        content shared by guides (repeating-variable guidelines)
data/home.js          home page content
data/calculator.js    calculator wording, the extractor's example, the starting table
data/feedback.js      feedback page wording and the Google Form link (formUrl)
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
extract.py       AI variable extractor (below)
views.py         GET /  (page + CSRF cookie) · POST /api/pi-groups/ · POST /api/extract-variables/ · GET /api/named-groups/
```

`POST /api/pi-groups/` body: `{"dependent": 0, "variables": [{"name": "ρ", "dims": [1,-3,0,0], "repeating": true}, …]}`
(dims = powers of M, L, T, Θ; `dependent` is a row index or null; tick no `repeating` to let the solver choose).
Errors come back as `{"ok": false, "error": "…"}` with status 400, worded for the student.
Add a named number: append it to `NAMED` in `named_groups.py` (and any new kind to `KINDS`).

## AI variable extractor (backend/pigroups/extract.py)
The first card of the calculator. The student types the problem statement and/or adds a picture of it (the browser
shrinks it to at most 1568 px before upload); Claude lists the variables involved with their M, L, T, Θ powers and which
one is dependent; **Use these in the table** fills the variable table.

- Model: Claude Opus 5.5 (`claude-opus-5-5`, change with `PILAB_EXTRACT_MODEL`), through the official `anthropic` SDK.
  The reply is constrained to a JSON schema (structured outputs) and checked again on the server. Server-side
  fallbacks are on (`fallbacks="default"`): if the model declines for policy reasons, the API retries on a fallback model.
- `POST /api/extract-variables/` body: `{"text": "…", "image": {"media_type": "image/jpeg", "data": "<base64>"} | null}`
  -> `{"ok": true, "variables": [{"symbol", "name", "dims", "role", "reason"}], "note"}`.
- Each call costs API credit, so each visitor may use it `PILAB_EXTRACT_PER_HOUR` times an hour (default 20).
- Tests use a stand-in for Claude, so `manage.py test` never calls the API.

## Feedback
The **Feedback** page explains why feedback matters for the final year project and links to the Google Form
(`formUrl` in `data/feedback.js`). Responses are collected and exported by Google Forms (Responses > Link to Sheets).

## Search engines
`index.html` has a description, link-preview tags, PNG icons (`img/favicon-48.png`, the one Google shows next to
results, plus 192 px, Apple touch icon and `img/logo-512.png`) and structured data naming the site **BuckinghamEdu**
with its logo. The server fills in the site's address (`__SITE__`) and serves `/robots.txt` and `/sitemap.xml`.
With a custom domain, set `PILAB_SITE_URL` (e.g. `https://www.buckinghamedu.com`).
Register the site in Google Search Console and submit `/sitemap.xml` (see the steps in the project notes).

## Put BuckinghamEdu online with Render (free)
Files: `render.yaml` (the Render setup) and `build.sh` (runs on each deploy).

1. **Render** (render.com): sign up with GitHub, **New > Blueprint**, pick `MLFTech/PI-LAB-APP`.
2. When asked, paste your `ANTHROPIC_API_KEY`. Deploy. The site is at `https://pi-lab.onrender.com`
   (or the name Render shows).

Every `git push` to `main` redeploys automatically. Free Render sites sleep after 15 minutes without visitors;
the next visit takes up to about a minute to wake it.

## Put BuckinghamEdu online (PythonAnywhere, free)
1. Sign up at pythonanywhere.com (free "Beginner" account). Your site will be `https://USERNAME.pythonanywhere.com`.
2. **Consoles > Bash**:
   ```
   git clone https://github.com/MLFTech/PI-LAB-APP.git pilab
   mkvirtualenv --python=python3.13 pilab        # newest Python offered
   pip install -r pilab/backend/requirements.txt
   ```
3. **Web** tab > Add a new web app > *Manual configuration* > same Python version. Then set
   *Virtualenv* `/home/USERNAME/.virtualenvs/pilab`, *Source code* `/home/USERNAME/pilab`, turn on *Force HTTPS*,
   and replace the WSGI file with:
   ```python
   import os, sys
   sys.path.insert(0, '/home/USERNAME/pilab/backend')
   os.environ['DJANGO_SETTINGS_MODULE'] = 'pilab_site.settings'
   os.environ['PILAB_DEBUG'] = '0'
   os.environ['PILAB_SECRET_KEY'] = 'PASTE-A-LONG-RANDOM-KEY'
   os.environ['PILAB_ALLOWED_HOSTS'] = 'USERNAME.pythonanywhere.com'
   os.environ['ANTHROPIC_API_KEY'] = 'sk-ant-...'
   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```
   Make a key with `python -c "import secrets; print(secrets.token_urlsafe(50))"`. Press **Reload**.

To update the site later: `cd ~/pilab && git pull`, then **Reload** on the Web tab.
Free PythonAnywhere accounts can only reach an allow-list of websites; check that api.anthropic.com is on it,
or the extractor will report that it cannot reach the AI service.
