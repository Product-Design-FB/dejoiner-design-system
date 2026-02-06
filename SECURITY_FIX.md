# SECURITY INCIDENT RESPONSE CHECKLIST

## ⚠️ IMMEDIATE ACTION REQUIRED

Your Figma access token was exposed in the public GitHub repository. Follow these steps immediately:

### 1. Revoke the Exposed Token (DO THIS FIRST!)
- [ ] Go to Figma → Settings → Personal Access Tokens
- [ ] Find token: `figd_kG15Zn9R4q12CMn-7CL2bQXOpq2uEJFLR11Fu7Sr`
- [ ] Click "Revoke" or "Delete"
- [ ] Generate a NEW token

### 2. Update Local Environment
- [ ] Open `.env.local` (or create if missing)
- [ ] Add: `FIGMA_ACCESS_TOKEN=your_new_token_here`
- [ ] Add: `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url`
- [ ] Add: `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key`

### 3. Update Supabase Settings
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Run:
```sql
UPDATE settings 
SET value = 'your_new_figma_token' 
WHERE key = 'figma_access_token';
```

### 4. Clean Git History
The token is in your Git history. You have two options:

#### Option A: Delete and Recreate Repo (Easiest)
- [ ] Create a new empty repo on GitHub
- [ ] Update remote: `git remote set-url origin <new-repo-url>`
- [ ] Force push: `git push -u origin main --force`

#### Option B: Use git-filter-repo (Advanced)
```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove file from history
git filter-repo --path supabase_setup.sql --invert-paths

# Force push (⚠️ DESTRUCTIVE)
git push origin --force --all
```

### 5. Add .gitignore Protection
- [x] Ensure `.env.local` is in `.gitignore`
- [x] Never commit tokens to Git again

### 6. Verify Security
- [ ] Check GitHub commits - token should be gone
- [ ] Check `.env.local` - new token should be there
- [ ] Test Figma sync with new token

## What Was Exposed
- Figma Access Token (revoke immediately!)
- Figma Team ID (less sensitive, but good to rotate)
- Slack Channel ID (low risk)

## Prevention
- ✅ All secrets in `.env.local` (gitignored)
- ✅ SQL files use placeholders only
- ✅ Never commit real tokens to Git
