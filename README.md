<div align="center">
  <br />
  <img src="frontend/public/apple-icon.png" alt="Chronoa Logo" width="96" />
  <br /><br />

  <h1>Chronoa</h1>
  <p><strong>Your aesthetic workspace. Completely synced.</strong></p>
  <p>
    Eliminate distractions. Bring your focus, planning, and reflection<br />
    into one beautifully synced ecosystem across every device you own.
  </p>

  <br />

  <a href="https://chronoa.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-chronoa.vercel.app-6366f1?style=for-the-badge&logoColor=white" alt="Live Demo" />
  </a>
  &nbsp;
  <a href="https://github.com/XeCipher/Chronoa">
    <img src="https://img.shields.io/badge/GitHub-XeCipher%2FChronoa-0f172a?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  &nbsp;
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="License" />
  </a>
  &nbsp;
  <a href="https://github.com/XeCipher/Chronoa/pulls">
    <img src="https://img.shields.io/badge/PRs-Welcome-f59e0b?style=for-the-badge" alt="PRs Welcome" />
  </a>

  <br /><br />

  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs" />
  &nbsp;
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  &nbsp;
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  &nbsp;
  <img src="https://img.shields.io/badge/Flask-Python-000000?style=flat-square&logo=flask" />
  &nbsp;
  <img src="https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />

  <br /><br />

</div>

---

## What is Chronoa?

Chronoa is a deeply immersive personal productivity workspace built for people who care about both **focus and aesthetics**. Rather than juggling five separate apps, Chronoa brings task management, time tracking, journaling, a calendar, and passive analytics into one seamless environment that stays in sync across all your devices in real time.

The background shifts in color throughout the day. Your timers follow you across every page. Your productivity earns you a rank.

<br />

---

## Features

<br />

<table>
  <tr>
    <td valign="top" width="50%">
      <h3>Task Management</h3>
      Infinite nesting, drag-and-drop reordering, and keyboard-first control throughout. Daily routine tasks reset automatically at your preferred hour, powered by a background scheduler.
    </td>
    <td valign="top" width="50%">
      <h3>Time Tracking</h3>
      Millisecond-accurate timers with a Global Widget that stays pinned to the corner as you navigate. Pause on your laptop and resume on your phone. State syncs the moment you switch.
    </td>
  </tr>
  <tr>
    <td valign="top" width="50%">
      <h3>Calendar</h3>
      Full drag-and-drop calendar with Month, Week, and Day views. Subscribe to any external <code>.ics</code> feed from Google Calendar or Apple Calendar directly, without importing anything.
    </td>
    <td valign="top" width="50%">
      <h3>Journaling</h3>
      A distraction-free rich text editor built on Tiptap with auto-save, daily prompts, and offline-first queueing. Write without internet and entries silently sync when you reconnect.
    </td>
  </tr>
  <tr>
    <td valign="top" width="50%">
      <h3>Analytics</h3>
      Passively surfaces your Chronotype (peak focus hours), flow states, and task distribution. Every action earns XP and advances you through 8 RPG-style ranks with animated badges.
    </td>
    <td valign="top" width="50%">
      <h3>Living Environment</h3>
      The abstract background continuously adapts its palette to the real time of day across four stages: Dawn, Day, Dusk, and Night. Your workspace breathes with you.
    </td>
  </tr>
</table>

<br />

---

## Tech Stack

<br />

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| State and UI | Zustand, dnd-kit, Tiptap, Recharts |
| Backend | Python, Flask, APScheduler |
| Database and Auth | Supabase (PostgreSQL, Realtime Channels, Storage) |
| Hosting | Vercel (Frontend), Render (Backend) |

<br />

---

## Project Structure

```
Chronoa/
│
├── backend/
│   ├── app.py                   # Flask API entry point
│   ├── config.py                # Environment configuration
│   ├── routes/
│   │   └── auth.py              # Account deletion and admin routes
│   └── services/
│       ├── db_client.py         # Supabase Python client
│       └── routine_reset.py     # APScheduler cron for daily routine resets
│
└── frontend/
    ├── app/                     # Next.js App Router (Dashboard, Landing, Auth)
    ├── components/
    │   ├── analytics/           # Recharts charts, heatmaps, rank badges
    │   ├── calendar/            # Month / Week / Day views, ICS parsing
    │   ├── home/                # Dynamic clock, scenery, weather widgets
    │   ├── notes/               # Tiptap distraction-free editor
    │   └── tasks/               # dnd-kit recursive task lists
    ├── lib/                     # Supabase client, ICS parsers
    ├── store/                   # Zustand stores (uiStore, timerStore)
    ├── next.config.ts
    └── tailwind.config.ts
```

<br />

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Python 3.9 or higher
- A [Supabase](https://supabase.com) project

<br />

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=8000
```

Start the server:

```bash
python app.py
```

This also boots the APScheduler daemon responsible for resetting daily routines at midnight.

<br />

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file inside `frontend/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Optional
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_FEEDBACK_FORM_URL=your_google_form_url
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

<br />

---

## Real-Time Architecture

Chronoa uses **Supabase Realtime Channels** to push state changes across devices instantly, with no polling and no manual refresh required.

```
  Device A (Laptop)               Supabase Realtime               Device B (Phone)
        |                                |                                |
        |  ── play timer ──────────────► |  ── broadcast ───────────────► |
        |  ── complete task ───────────► |  ── rt_normal_* ─────────────► |  instant UI update
        |                                |                                |
        |         Flask APScheduler fires at midnight per user timezone   |
        |                  → unchecks all daily routine tasks             |
```

| Channel | Responsibility |
| --- | --- |
| `profiles.timer_state` | Syncs play, pause, and stop events across all active sessions |
| `rt_normal_*` | Broadcasts task completions, additions, and deletions live |
| Flask APScheduler | Cron job that resets daily routines at midnight per user timezone |

<br />

---

## Deployment

| Service | Platform | Notes |
| --- | --- | --- |
| Frontend | Vercel | Next.js edge deployment with PWA support. Installable on iOS via Safari. |
| Backend | Render | Hosts the Flask server and the continuous APScheduler daemon. |
| Database | Supabase | Handles PostgreSQL, Auth, Realtime channels, and image storage. |

An optimized **Android APK** is also available for direct download from within the app.

<br />

---

## Quick Start Guide

Once the app is running or after visiting [chronoa.vercel.app](https://chronoa.vercel.app):

1. Sign in with your Google account.
2. Use `Alt + T` to jump to Tasks and `Alt + C` to jump to Calendar.
3. Create a daily routine task. It resets automatically at midnight.
4. Complete tasks and write journal entries to earn XP and advance your rank.

<br />

---

## Contributing

All contributions are welcome, whether that is a bug fix, a new feature, a design improvement, or a suggestion.

If you have something specific in mind, open a [pull request](https://github.com/XeCipher/Chronoa/pulls) directly. For larger changes or feature proposals, consider opening an [issue](https://github.com/XeCipher/Chronoa/issues) first so the direction can be discussed before you invest the time building it. There are no gatekeeping rules, just keep changes focused and intentional.

```bash
# 1. Fork the repository and clone it
git clone https://github.com/XeCipher/Chronoa.git

# 2. Create a branch for your change
git checkout -b feature/your-feature-name

# 3. Make your changes and commit
git commit -m "feat: describe your change clearly"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

<br />

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

<br />

---

<div align="center">
  <sub>Built with obsession over details &nbsp;·&nbsp; <a href="https://chronoa.vercel.app">chronoa.vercel.app</a></sub>
</div>
