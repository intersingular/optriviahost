# 🎉 Trivia Night — Setup Guide

Everything you need to get this running on a real URL where 10+ players can join from their phones.

**Total time: ~25 minutes** (one-time setup)

---

## What you're setting up

```
Your trivia app (React)  ──▶  Hosted on Vercel (free, gives you a URL)
        │
        └── talks to ──▶  Firebase (free database that syncs everyone's devices in real-time)
```

---

## Step 1: Install Node.js (5 min)

Node.js is what runs the app on your computer during development.

1. Go to **https://nodejs.org**
2. Click the big green **"Download"** button (LTS version)
3. Run the installer, click Next through everything
4. To verify it worked, open **Terminal** (Mac) or **Command Prompt** (Windows) and type:

```
node --version
```

You should see something like `v20.x.x`. If you see an error, restart your computer and try again.

---

## Step 2: Get the project running locally (5 min)

1. Download and unzip this project folder somewhere on your computer (like your Desktop)

2. Open **Terminal** (Mac) or **Command Prompt** (Windows)

3. Navigate to the project folder. If you put it on your Desktop:

```bash
# Mac:
cd ~/Desktop/trivia-project

# Windows:
cd %USERPROFILE%\Desktop\trivia-project
```

4. Install dependencies (this downloads the libraries the app needs):

```bash
npm install
```

5. Start the app:

```bash
npm run dev
```

6. Open **http://localhost:5173** in your browser — you should see the Trivia Night home screen! 🎉

⚠️ The app will show errors in the console until you complete Step 3 (Firebase). That's normal.

---

## Step 3: Set up Firebase (10 min)

Firebase is a free Google service that syncs data between all your players' phones in real-time.

### 3a. Create a Firebase project

1. Go to **https://console.firebase.google.com**
2. Sign in with any Google account
3. Click **"Create a project"** (or "Add project")
4. Name it something like `trivia-night`
5. You can disable Google Analytics (not needed) → click **Create Project**
6. Wait for it to finish, then click **Continue**

### 3b. Create the database

1. In the left sidebar, click **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. Choose any location (default is fine) → click **Next**
4. Select **"Start in test mode"** → click **Enable**
   - Test mode lets anyone read/write, which is fine for a trivia game with friends

### 3c. Register a web app

1. On the main project page, click the **web icon** `</>` (it looks like angle brackets)
2. Give it a nickname like `trivia-web` 
3. You do NOT need Firebase Hosting (uncheck it if checked) → click **Register app**
4. You'll see a code block with your config values. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "trivia-night-xxxxx.firebaseapp.com",
  databaseURL: "https://trivia-night-xxxxx-default-rtdb.firebaseio.com",
  projectId: "trivia-night-xxxxx",
  storageBucket: "trivia-night-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. **Copy these values** (you need them in the next step)

### 3d. Paste your config into the app

1. Open the file `src/firebase.js` in any text editor (TextEdit on Mac, Notepad on Windows — or VS Code if you have it)
2. Replace each `PASTE_YOUR_...` placeholder with the matching value from Firebase
3. Save the file

That's it! Go back to your browser at `http://localhost:5173` and the app should now work with no errors. Test it by opening two tabs — one as Host, one as Player.

---

## Step 4: Deploy to a real URL (5 min)

Vercel gives you a free public URL (like `trivia-night.vercel.app`) so anyone can open your app on their phone.

### 4a. Push your code to GitHub

1. Create a free account at **https://github.com** (if you don't have one)
2. Click the **"+"** button (top right) → **"New repository"**
3. Name it `trivia-night`, keep it **Private**, click **Create repository**
4. In your Terminal (in the project folder), run these commands one at a time:

```bash
git init
git add .
git commit -m "trivia app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/trivia-night.git
git push -u origin main
```

(Replace `YOUR_USERNAME` with your actual GitHub username)

If it asks for a password, you may need to create a **Personal Access Token**: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic) → check `repo` → copy the token and use it as your password.

### 4b. Deploy on Vercel

1. Go to **https://vercel.com** and sign up with your GitHub account
2. Click **"Add New Project"**
3. Find and select your `trivia-night` repository
4. Leave all settings as default → click **Deploy**
5. Wait ~1 minute. Vercel will give you a URL like `trivia-night.vercel.app`

**That's your live trivia app!** 🎉 Share that URL with your players.

---

## How to run the actual trivia night

### Before the party
1. Open your app URL on your laptop (this is the host screen)
2. Click **"Build Trivia"** to review/edit questions
3. For music round questions, paste YouTube video IDs and set start/end timestamps

### At the party
1. Click **"Host a Game"** — you'll see a 4-letter game code
2. Tell players to open the same URL on their phones and tap **"Join as Player"**
3. Players enter the code + their name
4. Once everyone's in, click **"Start Game"**
5. Walk through questions with the presentation (arrow keys or buttons)
6. Players answer on their phones
7. When you hit the answer reveal slides, you'll see who got what right
8. Click the score badge next to any player to override if needed
9. Final scores show automatically at the end!

### Tips
- The host should use a laptop/TV for the presentation (big screen)
- Players use their phones
- The slide navigator (click the slide counter at the bottom) lets you jump around
- You can end early with the "✕ End Game" button in the top corner

---

## Troubleshooting

**"Firebase: No Firebase App" error**
→ Your `src/firebase.js` config values are wrong. Double-check them against your Firebase console.

**Players can't connect / game code not found**
→ Make sure your Firebase Realtime Database is in **test mode** (check Rules tab in Firebase console — it should say `.read: true, .write: true`).

**YouTube clips don't play**
→ Make sure you're using the 11-character video ID (the part after `v=` in a YouTube URL), not the full URL. Example: for `https://www.youtube.com/watch?v=dEIRVQFqj-k`, the ID is `dEIRVQFqj-k`.

**Changes I made aren't showing on the live site**
→ Push your changes to GitHub (`git add . && git commit -m "update" && git push`). Vercel auto-deploys within ~30 seconds.

---

## Optional: Custom domain

If you want a custom URL like `trivia.yourdomain.com`:
1. Buy a domain from Namecheap, Google Domains, or Cloudflare (~$10/year)
2. In Vercel → your project → Settings → Domains → Add your domain
3. Vercel will tell you what DNS records to set — follow those instructions in your domain registrar

---

## Firebase free tier limits (more than enough)

- 1 GB storage, 10 GB/month transfer
- 100 simultaneous connections
- For reference: 10 players answering trivia uses < 0.01% of these limits
