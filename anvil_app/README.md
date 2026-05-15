# OBLITERATUS — Anvil.work Port

Run OBLITERATUS as an [Anvil.work](https://anvil.works) web app with a split
architecture: the **web UI** runs on Anvil's servers while all **GPU-heavy
computation** runs on your own machine via the
[Anvil Uplink](https://anvil.works/docs/uplink).

## Architecture

```
┌──────────────────────────────────┐
│         Anvil.work Cloud         │
│                                  │
│  client_code/     server_code/   │
│  (Forms + UI)    (ServerModule)  │
│       │               │         │
│       └───── calls ────┘         │
│               │                  │
└───────────────┼──────────────────┘
                │ Anvil Uplink
                ▼
┌──────────────────────────────────┐
│     Your GPU Machine             │
│                                  │
│  uplink_server.py                │
│  ├── obliteratus pipeline        │
│  ├── model loading (PyTorch)     │
│  ├── chat inference              │
│  └── benchmarking / tourney      │
└──────────────────────────────────┘
```

- **Client Forms** (browser): UI for each tab — Obliterate, Chat, Benchmark,
  A/B Compare, Strength Sweep, Tourney, Export, Push to Hub, Leaderboard.
- **Server Module** (Anvil cloud): Thin coordination layer that routes calls
  to the Uplink backend. Provides fallback responses when the Uplink is offline.
- **Uplink Server** (your machine): Runs the full OBLITERATUS pipeline with
  GPU access. All model loading, abliteration, and inference happens here.

## Quick Start

### 1. Import the App into Anvil

**Option A — Git clone:**
```bash
# Clone this repo
git clone https://github.com/marpogiii-code/OBLITERATUS.git
cd OBLITERATUS/anvil_app

# Push to your Anvil app (get the Git URL from Anvil's Version History tab)
git remote add anvil <your-anvil-git-url>
git subtree push --prefix=anvil_app anvil master
```

**Option B — Manual upload:**
1. Create a new blank app at [anvil.works/build](https://anvil.works/build)
2. Open the app's Version History → Clone with Git
3. Clone, replace the contents with files from `anvil_app/`, commit and push

### 2. Enable the Uplink

1. In your Anvil app, go to **Settings → Uplink**
2. Click **Enable Server Uplink**
3. Copy the Uplink key (starts with `server_`)

### 3. Run the Uplink Server on Your GPU Machine

```bash
# Install OBLITERATUS and the Anvil Uplink
cd OBLITERATUS
pip install -e ".[spaces]"
pip install anvil-uplink

# Start the Uplink server
python anvil_app/uplink_server.py server_YOUR_KEY_HERE

# Or use an environment variable
export ANVIL_UPLINK_KEY="server_YOUR_KEY_HERE"
python anvil_app/uplink_server.py
```

You should see:
```
  OBLITERATUS - Anvil Uplink Server
  Device: cuda
  VRAM:   GPU 0: NVIDIA A100 | 0.0/40.0 GB used | 40.0 GB free
  Connected! Waiting for requests...
```

### 4. Open Your App

Go to your Anvil app URL and start obliterating!

## Features

All features from the original Gradio app are available:

| Tab | Description |
|-----|-------------|
| **Obliterate** | Select a model, method, and settings → run abliteration |
| **Benchmark** | Multi-method and multi-model benchmarking |
| **Chat** | Chat with obliterated models |
| **A/B Compare** | Side-by-side original vs abliterated |
| **Strength Sweep** | Dose-response curve (regularization vs refusal) |
| **Tourney** | Tournament mode — methods compete in elimination rounds |
| **Export** | Download research artifacts (directions, config, results) |
| **Push to Hub** | Push obliterated models to HuggingFace Hub |
| **Leaderboard** | Community benchmark leaderboard |

## File Structure

```
anvil_app/
├── __init__.py
├── anvil.yaml                    # App configuration
├── README.md                     # This file
├── uplink_server.py              # Run on GPU machine
├── client_code/
│   ├── MainForm/                 # Main tabbed navigation
│   ├── ObliterateForm/           # Model obliteration
│   ├── ChatForm/                 # Chat interface
│   ├── BenchmarkForm/            # Multi-method benchmarks
│   ├── ABCompareForm/            # A/B comparison
│   ├── StrengthSweepForm/        # Regularization sweep
│   ├── TourneyForm/              # Tournament mode
│   ├── ExportForm/               # Artifact download
│   ├── PushToHubForm/            # HuggingFace Hub push
│   └── LeaderboardForm/          # Community leaderboard
├── server_code/
│   └── ServerModule.py           # Server-side coordination
└── theme/
    ├── parameters.yaml
    ├── templates.yaml
    └── assets/
        ├── standard-page.html
        └── theme.css             # OBLITERATUS dark theme
```

## Requirements

**Anvil app:** No special requirements — runs on Anvil's servers.

**GPU machine (Uplink):**
- Python 3.10+
- CUDA-capable GPU (or Apple Silicon with MPS)
- All OBLITERATUS dependencies (`pip install -e ".[spaces]"`)
- `anvil-uplink` package (`pip install anvil-uplink`)

## Notes

- The Uplink server must be running for GPU operations to work. Without it,
  the app shows fallback data (model list, defaults) but cannot obliterate
  or chat.
- Each Uplink connection supports one user at a time. For multi-user
  deployments, consider running multiple Uplink instances behind a load
  balancer.
- Session models are stored in `/tmp` on the GPU machine and persist until
  the Uplink server restarts.
