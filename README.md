# Quban: Portfolio of Qhawe Moyo

A hand-built personal portfolio for Qhawe "Quban" Moyo, senior software developer. Vanilla HTML, CSS and JavaScript only: no frameworks, no build step, no dependencies.

It is a portfolio first and a playground second: a living network background, a scroll-driven "darkroom" for projects, a competency tree, and a terminal you can actually play games in.

## Highlights

- **Living network background**: a full-page particle network canvas behind everything. It reacts to the cursor, recolours with the theme, and hides a clickable node that starts a game.
- **Light/dark theme with an explosive reveal**: switching themes detonates from the toggle button using the View Transitions API (with a graceful fallback).
- **Projects "darkroom"**: scroll-driven gallery where project prints develop on the table, with a loupe lightbox. Curated projects are merged with public, non-fork repos from GitHub.
- **Competency tree**: a procedurally generated SVG tree whose branches grow as you scroll. Falls back to a plain list on small screens.
- **Nav clock**: sits next to the logo with two faces, each with its own look. Click to swap: split-flap digits, or glowing Roman numerals labelled HORAE / MINUTAE / SECUNDAE (with – for zero).
- **Preloader**: a console-style boot screen. Ribbons of green light swirl around a blob of living goo (metaballs on a canvas) while the page, fonts and guestbook load behind it, so the guestbook is already filled in. When everything is ready the streaks and goo explode outward and the site appears. The full intro plays on the first load of a visit and a short version after that. It shows no text, never blocks for more than a few seconds, stays dark whatever the theme, is a still image for reduced-motion users, and is skipped without JavaScript.
- **Command palette**: `Ctrl+K` for navigation, theme, games and secrets.
- **Experience, skills, education, certifications and contact**, all rendered from one data file.

## The terminal

The terminal in the About section is real. Type `help` to see everything.

| Command | What it does |
| --- | --- |
| `whoami`, `codename`, `experience` | Who this is |
| `ls [-a]`, `cat <file>` | Poke around the files (there is a hidden one) |
| `skills`, `projects` | The toolbox and what's been built |
| `play snake` / `snake` | Snake where the food is your skills |
| `sudoku [easy\|medium\|hard]` | Sudoku with generated, uniquely solvable puzzles |
| `minesweeper [easy|medium|hard]` | Classic Minesweeper (first click is always safe) |
| `typefall` / `type` | A ZType-style game: type the falling words before they land |
| `defend` | Network Defender: click infected nodes in the background network |
| `crt` | Retro CRT mode |
| `guestbook`, `theme`, `hire`, `achievements`, `clear` | Utilities |

While Snake, Sudoku or Typefall is running, the game takes over the whole terminal window. Esc exits. Scrolling away pauses the game and gives the keyboard back, so WASD and typing work everywhere else.

### Games

- **Snake**: grid sized to the window, skills as food, swipe controls on touch.
- **Sudoku**: arrows or WASD to move, 1-9 to place, `N` for pencil notes, `H` for a hint, `X` for a new puzzle, or use the on-screen number pad. Wrong digits show red; best times are saved per difficulty.
- **Minesweeper**: click to reveal, right-click (or long-press on touch, or the Flag button) to flag, click a satisfied number to chord. Arrow keys + Space/F also work. Hard needs a wider window.
- **Typefall**: words from the skills list fall; type their letters to lock on and shoot. Five lives, rising levels, combo and accuracy tracking. On touch, tap the game to raise the keyboard.
- **Network Defender**: infected nodes appear in the background network; click them to patch before nine breaches get through.

## Achievements

A trophy button in the nav tracks hidden achievements, with an Xbox-style unlock banner and a synthesised chime (toggle sound in the panel). Progress is saved in `localStorage`, and the panel has a **Reset progress** button (two clicks to confirm).

| Achievement | How to unlock |
| --- | --- |
| Hungry for skills | Eat 5 skills in terminal Snake |
| Number cruncher | Solve a Sudoku in the terminal |
| Touch typist | Shoot down 20 words in Typefall |
| Patch Tuesday | Patch 10 infected nodes in Network Defender |
| Old school | Enter the Konami code (up up down down left right left right B A) |
| Long John Silver | Make two safe clicks in Minesweeper (no need to finish) |
| Pen pal | Sign the guestbook |
| Root access | Run `sudo hire-me` in the terminal |
| Clock King Approval | Click the nav clock to flip it to Roman numerals |

## Other fun bits

- Konami code toggles a CRT scanline mode.
- Leaf trail that follows the cursor while it is over the competency tree.
- **Guestbook**: works locally out of the box. With a Firebase Realtime Database it becomes shared and moderated: see [Guestbook setup](#guestbook-setup-firebase).

## Project structure

```
index.html        page structure
css/style.css     all styling: tokens, sections, games, achievements
js/data.js        all content (projects, experience, skills, guestbook config)
js/main.js        theme, network canvas, nav, reveal, command palette
js/tree.js        competency tree
js/darkroom.js    projects gallery + loupe
js/fun.js         storage, confetti, achievements, Konami, leaf trail
js/clock.js       nav flip clock (flip / Roman)
js/terminal.js    terminal + Snake
js/games.js       Sudoku + Typefall
js/defender.js    Network Defender
js/preloader.js   loading screen logic (what to wait for, and for how long)
js/preloader-fx.js  the boot-screen canvas animation
js/guestbook.js   guestbook
guestbook/        moderation page (served at /guestbook/)
```

## Run it

No build needed. Serve the folder with any static server, for example:

```bash
npx serve .
```

or just open `index.html`. Some features (such as fetching public GitHub repos) need to be served over http.

## Customising

Almost everything lives in `js/data.js`: edit your details, projects (title, tagline, accent colour, links), experience, skills and competencies there. The GitHub username used for the darkroom's repo merge is `githubUser`.

## Accessibility and performance

Respects `prefers-reduced-motion` (animations, particle bursts and the achievement button effects are toned down or disabled), keeps keyboard access for the palette, nav, panel and loupe, and ships zero runtime dependencies.

## Guestbook setup (Firebase)

1. **Realtime Database**: in the Firebase console go to Build > Realtime Database > Create Database (locked mode). Copy its URL into `guestbook.endpoint` in `js/data.js`.
2. **Authentication**: Build > Authentication > Get started > Email/Password > Enable. Then Users > Add user (your email and a strong password) and copy that user's **User UID**.
3. **Web API key**: Project settings > General > Web API Key. Put it in `guestbook.apiKey` in `js/data.js` (it is public by design).
4. **Rules**: in the Realtime Database Rules tab, paste this and replace `YOUR_UID` with the UID from step 2:

```json
{
  "rules": {
    "guestbook": {
      ".read": true,
      "$id": {
        ".write": "auth.uid === 'YOUR_UID' || (!data.exists() && newData.child('ok').val() === false)",
        ".validate": "newData.child('name').isString() && newData.child('name').val().length <= 24 && newData.child('msg').isString() && newData.child('msg').val().length <= 240 && !newData.child('msg').val().matches(/.*(http|www\\.).*/)"
      }
    }
  }
}
```

Visitors can only create notes, and only with `ok: false`. Only your signed-in account can approve, edit or delete.

### Moderating

Open `/guestbook/` on your site and sign in. Pending notes can be approved, edited or denied; approved notes can be unpublished, edited or deleted. Notes containing links are flagged. Your session lives in the tab only and ends when you close it.

A visitor sees their own pending note marked "awaiting approval". If you deny it, it disappears from their view the next time they load the guestbook.

Unapproved notes are hidden on the site, not secret: the database URL is public-read, so anyone who knows it can read pending notes directly.
