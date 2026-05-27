# SoundCloud Clone

A full-featured music streaming platform built with Next.js, inspired by SoundCloud.

## Features

- **Authentication** — Sign up, sign in, sign out with secure password hashing
- **Music Upload** — Upload audio files (MP3, WAV, FLAC, etc.) with cover art
- **Audio Player** — Global persistent player with play/pause, seek, volume, shuffle, repeat
- **Waveform Visualization** — Canvas-based waveform display with seek interaction
- **User Profiles** — Profile pages with tracks, followers, following counts
- **Explore & Discover** — Browse tracks by genre, popularity, or recency
- **Search** — Search across tracks, users, and playlists
- **Likes** — Like/unlike tracks
- **Comments** — Timestamped comments on tracks
- **Playlists** — Create, manage, and play playlists
- **Follow System** — Follow/unfollow other users
- **Feed** — Personalized feed from followed artists
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite via Prisma ORM
- **Authentication**: NextAuth.js with Credentials provider
- **Audio**: HTML5 Audio API + Canvas waveform rendering

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Initialize database
npx prisma db push

# Seed demo data (optional)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts

| Email | Password |
|---|---|
| demo@soundcloud.com | password123 |
| artist@soundcloud.com | password123 |
| dj@soundcloud.com | password123 |

## Project Structure

```
soundcloud-clone/
├── prisma/              # Database schema & seed
├── public/uploads/      # Uploaded audio & images
├── src/
│   ├── app/             # Next.js App Router pages & API routes
│   │   ├── api/         # REST API endpoints
│   │   ├── explore/     # Browse tracks
│   │   ├── library/     # User library (likes, playlists)
│   │   ├── login/       # Sign in
│   │   ├── playlist/    # Playlist detail
│   │   ├── profile/     # User profiles
│   │   ├── search/      # Search results
│   │   ├── signup/      # Create account
│   │   ├── track/       # Track detail
│   │   └── upload/      # Upload tracks
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React context (Player state)
│   ├── lib/             # Utilities, Prisma client, auth config
│   └── types/           # TypeScript type definitions
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create new account |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET | `/api/tracks` | List tracks (with filters) |
| GET/PUT/DELETE | `/api/tracks/[id]` | Track CRUD |
| POST | `/api/tracks/[id]/like` | Toggle like |
| GET/POST | `/api/tracks/[id]/comments` | Comments |
| POST | `/api/upload` | Upload track |
| GET | `/api/users/[id]` | User profile |
| POST | `/api/users/[id]/follow` | Toggle follow |
| GET/POST | `/api/playlists` | Playlists |
| GET/DELETE | `/api/playlists/[id]` | Playlist detail |
| POST/DELETE | `/api/playlists/[id]/tracks` | Playlist tracks |
| GET | `/api/search` | Search |
