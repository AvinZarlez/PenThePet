# Debugging and Testing Branches

Complete guide for testing changes on branches before merging to main.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Testing Without Cloning (GitHub Pages)](#testing-without-cloning-github-pages)
- [Testing Locally](#testing-locally)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Reference

| Method | Setup Time | Best For | Limitations |
|--------|------------|----------|-------------|
| **GitHub Pages (branch)** | 5 min | Quick visual testing | Requires repo settings change |
| **Local testing** | 2 min | Development & debugging | Requires local clone |
| **GitHub Codespaces** | 3 min | No local setup needed | Requires GitHub Pro (or free hours) |

## Testing Without Cloning (GitHub Pages)

GitHub Pages can deploy from **any branch**, not just `main`. This lets you test changes live without cloning locally.

### Option 1: Deploy a Branch to GitHub Pages (Recommended for Testing)

**Setup (one-time per branch):**

1. **Push your branch to GitHub**
   ```bash
   git checkout my-feature-branch
   git push origin my-feature-branch
   ```

2. **Configure GitHub Pages to use your branch:**
   - Go to repository **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Under **Branch**, select your branch (e.g., `my-feature-branch`) and `/root`
   - Click **Save**
   
   ![GitHub Pages Settings Example](https://docs.github.com/assets/images/help/pages/source-branch-dropdown.png)

3. **Wait for deployment** (~1-2 minutes)
   - Go to **Actions** tab
   - Watch for "pages build and deployment" workflow
   - Wait for green checkmark ✓

4. **Test your changes**
   - Visit: `https://<username>.github.io/<repository>/`
   - Example: `https://avinzarlez.github.io/penthepet/`
   - The site now shows your branch's code!

**Making updates:**
```bash
# Make changes in your branch
git add .
git commit -m "Update feature"
git push origin my-feature-branch

# Wait 1-2 minutes, then refresh the GitHub Pages URL
# Your changes will appear automatically
```

**⚠️ Important Notes:**
- Only **one branch** can be deployed at a time
- This temporarily replaces the main site
- Remember to switch back to `main` branch when done testing!

**Restoring main branch:**
1. Go to **Settings** → **Pages**
2. Under **Branch**, select `main` and `/root`
3. Click **Save**
4. Main site restored in 1-2 minutes

### Option 2: Use GitHub Codespaces (Preview Environment)

GitHub Codespaces provides a cloud-based development environment with live preview.

**Setup:**

1. **Open Codespace:**
   - Go to your branch on GitHub
   - Click **Code** → **Codespaces** → **Create codespace on [branch]**
   - Wait for environment to load (~1 minute)

2. **Start server:**
   ```bash
   python3 -m http.server 8080
   ```

3. **Preview:**
   - Click "Open in Browser" when prompted
   - Or go to **Ports** tab → click port 8080 URL

**Pros:**
- ✅ No local setup required
- ✅ Full development environment
- ✅ Can test multiple branches simultaneously (separate Codespaces)

**Cons:**
- ❌ Requires GitHub account
- ❌ Free tier limited to 60 hours/month (Pro/Team get more)
- ❌ Not a "public" URL (requires GitHub auth to view)

### Option 3: PR Preview Comments (Future Enhancement)

**Note:** This project doesn't currently have automated PR preview deployments, but they can be added using services like:

- **Netlify** - Free tier includes PR previews
- **Vercel** - Automatic preview deployments for PRs
- **GitHub Actions** - Custom workflow to deploy PRs to separate URLs

These would provide unique URLs like:
- `https://pr-123-penthepet.netlify.app/`
- Automatically update on each push to PR

## Testing Locally

Local testing is the **fastest and most flexible** method for active development.

### Initial Setup (One-Time)

**Prerequisites:**
- Git installed
- Python 3, Node.js, or PHP (for local server)

**Steps:**

1. **Clone repository:**
   ```bash
   git clone https://github.com/AvinZarlez/PenThePet.git
   cd PenThePet
   ```

2. **Checkout the branch you want to test:**
   ```bash
   # List all branches
   git branch -a
   
   # Switch to your branch
   git checkout my-feature-branch
   
   # Or create and switch to new branch
   git checkout -b my-new-branch
   ```

3. **Start a local web server:**
   
   Choose one based on what's installed:
   
   ```bash
   # Python 3 (most common)
   python3 -m http.server 8080
   
   # Python 2 (older systems)
   python -m SimpleHTTPServer 8080
   
   # Node.js (if you have npx)
   npx http-server -p 8080
   
   # PHP
   php -S localhost:8080
   ```

4. **Open in browser:**
   - Navigate to: `http://localhost:8080`
   - Game should load immediately!

### Development Workflow

**Making and testing changes:**

```bash
# 1. Make sure you're on correct branch
git branch  # Shows current branch with *

# 2. Edit files in your editor
# (Make your changes to HTML/CSS/JS files)

# 3. Save changes

# 4. Refresh browser (hard refresh)
# - Mac: Cmd + Shift + R
# - Windows/Linux: Ctrl + Shift + R

# 5. Test in browser
# (Check DevTools console for errors)

# 6. Commit when satisfied
git add .
git commit -m "Describe your changes"
git push origin my-feature-branch
```

**Why hard refresh?**
Browsers cache CSS/JS files. Hard refresh forces reload of all assets, ensuring you see your latest changes.

### Testing Multiple Branches Simultaneously

You can test multiple branches at once using different methods:

**Method 1: Multiple local clones** (easier but uses more disk space)
```bash
# Clone to different directories
git clone https://github.com/AvinZarlez/PenThePet.git penthepet-main
git clone https://github.com/AvinZarlez/PenThePet.git penthepet-branch1

# In terminal 1
cd penthepet-main
git checkout main
python3 -m http.server 8080

# In terminal 2
cd penthepet-branch1
git checkout my-feature-branch
python3 -m http.server 8081

# Now test:
# http://localhost:8080 - main branch
# http://localhost:8081 - feature branch
```

**Method 2: Git worktrees** (advanced, shares .git)
```bash
# In your main clone
git worktree add ../penthepet-feature my-feature-branch

# In terminal 1
cd PenThePet
python3 -m http.server 8080

# In terminal 2
cd ../penthepet-feature
python3 -m http.server 8081

# Cleanup when done
git worktree remove ../penthepet-feature
```

### Advanced Local Testing

**With developer tools (for development):**

If you're adding tests or using linting:

```bash
# Install Node.js development dependencies
npm install

# Run tests
npm test

# Run tests in watch mode (auto-runs on file changes)
npm run test:watch

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

**Access game object in console:**

The game exposes a global object for debugging:

```javascript
// Open browser console (F12)
window.game              // Main game instance
window.game.grid         // Grid object
window.game.grid.tiles   // Current tile layout
window.game.grid.goal    // Goal area

// Example: Check current grid state
console.log(window.game.grid.tiles);

// Example: Force re-render
window.game.render();
```

**Browser DevTools tips:**

1. **Network tab** - Check if files load correctly
2. **Console tab** - See JavaScript errors and logs
3. **Sources tab** - Set breakpoints for debugging
4. **Application tab** - Inspect cookies (settings persistence)
5. **Responsive mode** - Test mobile layouts (Cmd/Ctrl + Shift + M)

## Best Practices

### Before Testing a Branch

**Checklist:**
- [ ] Know what you're testing (specific feature/fix)
- [ ] Decide: local testing or GitHub Pages?
- [ ] If using GitHub Pages, plan to restore main when done
- [ ] Have a clear test plan (what to click, what to verify)

### During Testing

**What to test:**
1. **Functionality** - Does the feature work?
2. **UI** - Does it look correct?
3. **Mobile** - Test responsive layout (DevTools device mode)
4. **Console** - Any JavaScript errors?
5. **Edge cases** - What happens with unusual inputs?

**Example test plan for a new tile type:**
```
✓ New tile renders with correct color
✓ New tile appears in legend
✓ New tile has hover effect
✓ New tile is clickable/non-clickable as expected
✓ Pet pathfinding works around new tile
✓ Map generation includes new tile
✓ No console errors
✓ Mobile layout looks correct
```

### After Testing

**Before merging:**
- [ ] Verify branch in browser (visual test)
- [ ] Check console for errors
- [ ] Test on mobile viewport
- [ ] Run automated tests: `npm test`
- [ ] Run linter: `npm run lint`
- [ ] If changed GitHub Pages branch, restore to `main`

**Merge process:**
```bash
# From your feature branch
git checkout main
git pull origin main
git merge my-feature-branch
git push origin main

# GitHub Actions will auto-deploy to Pages in ~2 minutes
```

## Troubleshooting

### "Changes not showing up in browser"

**Causes & Solutions:**

1. **Browser cache:**
   - Solution: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
   - Or: Open DevTools → Network tab → Disable cache (checkbox)

2. **Wrong branch deployed on GitHub Pages:**
   - Check: Settings → Pages → Which branch is selected?
   - Solution: Switch to correct branch, wait for deployment

3. **GitHub Pages not updated yet:**
   - Check: Actions tab for deployment status
   - Wait: Deployments take 1-2 minutes

4. **Local server serving cached files:**
   - Solution: Stop and restart the server
   - Solution: Clear browser cache completely

### "Local server won't start"

**"Address already in use" error:**
```bash
# Find what's using port 8080
lsof -i :8080  # Mac/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process or use different port
python3 -m http.server 8081
```

**"Python command not found":**
```bash
# Try different variations
python --version
python3 --version

# Or use Node.js instead
npx http-server -p 8080

# Or use PHP
php -S localhost:8080
```

### "Game loads but features broken"

**Check console errors:**
1. Open DevTools (F12)
2. Look at Console tab for red errors
3. Common issues:
   - File not found (404) - Check file paths
   - Syntax error - Check recent code changes
   - Undefined variable - Check script loading order

**Verify script loading order:**

Scripts must load in specific order (see `index.html`):
1. constants.js
2. config.js
3. tileTypes.js
4. PathfindingUtils.js
5. MILPSolver.js
6. MapGenerator.js
7. Grid.js
8. Game.js
9. Menu.js
10. main.js

### "Tests fail locally but pass in CI"

**Possible causes:**
- Different Node.js versions
- Missing dependencies
- Uncommitted files

**Solutions:**
```bash
# Check Node version (need 20+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for uncommitted changes
git status

# Run tests with verbose output
npm test -- --verbose
```

### "GitHub Pages shows 404"

**Possible causes:**
- Pages not enabled
- Wrong branch/path configured
- Files not pushed

**Solutions:**
1. Check Settings → Pages is enabled
2. Verify branch is correct (usually `main`)
3. Verify path is `/root` (not `/docs`)
4. Check Actions tab for deployment errors
5. Ensure `index.html` is in repository root

### "Can't test without cloning and GitHub Pages deploys to production"

**Current limitations:**

PenThePet doesn't have PR preview deployments yet. Your options:

1. **Use GitHub Pages branch switching** (temporarily replaces main)
2. **Use GitHub Codespaces** (cloud development environment)
3. **Clone locally** (fastest for active development)

**Future enhancement:**

Consider adding PR preview deployments using:
- Netlify Deploy Previews (free tier)
- Vercel GitHub integration
- Cloudflare Pages
- Custom GitHub Actions workflow

This would provide isolated preview URLs for each PR without affecting production.

## Summary

### Quick Decision Guide

**"I want to quickly see the branch live"**
→ Use GitHub Pages branch switching (5 min setup)

**"I'm actively developing"**
→ Clone locally and use local server (best workflow)

**"I don't want to install anything"**
→ Use GitHub Codespaces (requires GitHub account)

**"I need to test multiple branches at once"**
→ Use local worktrees or multiple clones

**"I want automated PR previews"**
→ Not available yet, but can be added

---

**Related Documentation:**
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development workflow and setup
- [TESTING.md](TESTING.md) - Running automated tests
- [CODE_STRUCTURE.md](CODE_STRUCTURE.md) - Understanding the codebase

**Need help?** Check the [troubleshooting section](#troubleshooting) or review the [main README](../README.md).
