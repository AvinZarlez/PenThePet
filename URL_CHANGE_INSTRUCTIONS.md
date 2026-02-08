# URL Change Instructions: Moving to Lowercase URLs

## Current Situation
- Repository: `AvinZarlez/PenThePet` (with capitals)
- GitHub Pages: `https://avinzarlez.github.io/PenThePet/`
- Custom Domain: `https://www.AvinZarlez.com/PenThePet`

## Goal
- Support lowercase URL: `https://www.avinzarlez.com/penthepet`

## Recommended Solution: Rename the Repository

Since this project is unreleased, **renaming the GitHub repository** is the cleanest and simplest solution. This eliminates the need for complex redirects and makes all URLs automatically lowercase.

### Benefits of Renaming
✅ No redirect configuration needed  
✅ All URLs automatically lowercase  
✅ Simpler long-term maintenance  
✅ No legacy concerns (unreleased project)  
✅ Cleaner URL structure  

## Step-by-Step Instructions

### 1. Rename the GitHub Repository

1. **Go to repository settings:**
   - Visit: https://github.com/AvinZarlez/PenThePet/settings
   
2. **Change the repository name:**
   - Scroll down to the "Repository name" section
   - Change `PenThePet` to `penthepet` (all lowercase)
   - Click "Rename" button
   - GitHub will warn you about the impact - this is expected
   - Confirm the rename

3. **GitHub automatically handles:**
   - Redirects from old URL to new URL (for a limited time)
   - Updates GitHub Pages URL to: `https://avinzarlez.github.io/penthepet/`
   - Updates all GitHub Actions and workflows
   - Updates issue/PR references

### 2. Update Your Local Git Remote

If you have a local clone of the repository:

```bash
# Navigate to your local repository
cd /path/to/your/PenThePet

# Update the remote URL
git remote set-url origin https://github.com/AvinZarlez/penthepet.git

# Verify the change
git remote -v

# Expected output:
# origin  https://github.com/AvinZarlez/penthepet.git (fetch)
# origin  https://github.com/AvinZarlez/penthepet.git (push)
```

### 3. Update Your Jekyll Site (www.avinzarlez.com)

You mentioned the main site runs on Jekyll. Here's what you need to update:

#### Option A: Direct Link/Redirect in Jekyll

In your Jekyll site repository, find any pages/configuration that reference PenThePet and update:

**Old:**
```
www.AvinZarlez.com/PenThePet → https://avinzarlez.github.io/PenThePet/
```

**New:**
```
www.avinzarlez.com/penthepet → https://avinzarlez.github.io/penthepet/
```

#### Option B: Jekyll Redirect Plugin

If you're using `jekyll-redirect-from` plugin, add to your page front matter:

```yaml
---
redirect_from:
  - /PenThePet/
  - /PenThePet
  - /penthepet/
  - /penthepet
redirect_to: https://avinzarlez.github.io/penthepet/
---
```

#### Option C: Nginx/Apache Redirect (if self-hosting)

If your Jekyll site is self-hosted with a web server:

**Nginx:**
```nginx
# In your nginx.conf or site configuration
location /penthepet {
    return 301 https://avinzarlez.github.io/penthepet/;
}

location /PenThePet {
    return 301 https://avinzarlez.github.io/penthepet/;
}
```

**Apache (.htaccess):**
```apache
# In your .htaccess file
RewriteEngine On
RewriteRule ^PenThePet/?$ https://avinzarlez.github.io/penthepet/ [R=301,L]
RewriteRule ^penthepet/?$ https://avinzarlez.github.io/penthepet/ [R=301,L]
```

### 4. Update Documentation (Done in this PR)

The following files have been updated to use lowercase URLs:
- `README.md` - Updated GitHub Pages link and clone command
- `docs/DEBUGGING_BRANCHES.md` - Updated all repository references
- `docs/DEVELOPMENT.md` - Updated deployment URL

### 5. Verify Everything Works

After completing the above steps:

1. **Test the GitHub Pages URL:**
   - Visit: `https://avinzarlez.github.io/penthepet/`
   - Should display the game correctly

2. **Test the custom domain redirect:**
   - Visit: `https://www.avinzarlez.com/penthepet`
   - Should redirect to GitHub Pages

3. **Test old URLs (temporary redirect):**
   - Visit: `https://avinzarlez.github.io/PenThePet/`
   - GitHub provides temporary redirect to new URL

4. **Clone with new URL:**
   ```bash
   git clone https://github.com/AvinZarlez/penthepet.git
   cd penthepet
   ```

## Alternative: Keep Current Name and Use Custom Domain

If you prefer NOT to rename the repository, you would need to:

1. **Add a CNAME file to the repository:**
   ```
   www.avinzarlez.com
   ```

2. **Configure DNS for your domain:**
   - Add CNAME record: `www.avinzarlez.com` → `avinzarlez.github.io`
   - Configure GitHub Pages to use custom domain

3. **Set up path-based routing in Jekyll:**
   - Configure Jekyll to serve content at `/penthepet/` path
   - This is more complex and requires Jekyll site restructuring

**However, renaming is much simpler and recommended for unreleased projects.**

## Files Changed in This PR

This PR updates all documentation to reference lowercase URLs:

1. **README.md**
   - Updated GitHub Pages link: `https://avinzarlez.github.io/penthepet/`
   - Updated git clone command to lowercase

2. **docs/DEBUGGING_BRANCHES.md**
   - Updated all repository URL examples
   - Updated GitHub Pages example URLs

3. **docs/DEVELOPMENT.md**
   - Updated deployment URL in comments

4. **URL_CHANGE_INSTRUCTIONS.md** (this file)
   - Complete guide for implementing the URL change

## Post-Rename Checklist

After renaming the repository, verify:

- [ ] GitHub repository URL works: `https://github.com/AvinZarlez/penthepet`
- [ ] GitHub Pages works: `https://avinzarlez.github.io/penthepet/`
- [ ] Local git remote updated
- [ ] Jekyll site redirect configured
- [ ] Custom domain redirect works: `https://www.avinzarlez.com/penthepet`
- [ ] GitHub Actions still run successfully
- [ ] All documentation updated (done in this PR)

## Questions?

If you encounter any issues during the rename process:

1. Check GitHub's documentation on [renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
2. GitHub provides automatic redirects from the old URL for convenience
3. The repository rename is instant and all links update automatically

## Summary

**Recommended action:** Rename the repository from `PenThePet` to `penthepet`

This is the simplest solution that:
- Requires no code changes to the game itself
- Automatically fixes all GitHub-related URLs
- Provides temporary redirects from old URLs
- Makes future maintenance easier
- Aligns with lowercase URL conventions

The only additional work needed is updating your Jekyll site configuration to redirect `www.avinzarlez.com/penthepet` to the new GitHub Pages URL.
