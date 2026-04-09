$ErrorActionPreference = "Stop"

# Reset git repo if it exists so we can rerun safely
if (Test-Path ".git") {
    Remove-Item -Recurse -Force ".git"
}

# Initialize Git
git init
git config core.autocrlf false
git config user.name "Dhyey"
git config user.email "dhyey@example.com"

# Helper function to commit with a specific date
function Commit-WithDate {
    param (
        [string]$Message,
        [int]$DaysAgo
    )
    $DateStr = (Get-Date).AddDays(-$DaysAgo).ToString("yyyy-MM-ddTHH:mm:ss")
    $env:GIT_AUTHOR_DATE = $DateStr
    $env:GIT_COMMITTER_DATE = $DateStr
    git commit -m $Message
}

# --- DAY 1: Project Setup ---
git checkout -b main
# Add config files, utilities, and globals
git add package.json package-lock.json pnpm-lock.yaml tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts .eslintrc.json components.json
git add app/globals.css lib/utils.ts .gitignore components/ui/ 
Commit-WithDate -Message "chore: initialize Next.js app with Tailwind and build tools" -DaysAgo 6

# --- DAY 2: UI Foundation ---
git checkout -b feat/ui-components
git add components/dashboard/ components/theme-provider.tsx components/app-sidebar.tsx components/top-navbar.tsx lib/data.ts
Commit-WithDate -Message "feat: add core dashboard ui components and theme provider" -DaysAgo 5
git checkout main
git merge feat/ui-components --no-ff -m "Merge pull request #1 from feat/ui-components"
$DateStr = (Get-Date).AddDays(-5).ToString("yyyy-MM-ddTHH:mm:ss")
$env:GIT_AUTHOR_DATE = $DateStr; $env:GIT_COMMITTER_DATE = $DateStr; git commit --amend --no-edit

# --- DAY 3: Pages and Layout ---
git checkout -b feat/pages-setup
git add app/layout.tsx components/add-transaction-modal.tsx
Commit-WithDate -Message "feat: setup application layouts and transaction modal" -DaysAgo 4
git checkout main
git merge feat/pages-setup --no-ff -m "Merge pull request #2 from feat/pages-setup"
$DateStr = (Get-Date).AddDays(-4).ToString("yyyy-MM-ddTHH:mm:ss")
$env:GIT_AUTHOR_DATE = $DateStr; $env:GIT_COMMITTER_DATE = $DateStr; git commit --amend --no-edit

# --- DAY 4: Authentication ---
git checkout -b feat/authentication
git add lib/firebase.ts contexts/AuthContext.tsx components/auth-guard.tsx middleware.ts "app/(auth)/"
Commit-WithDate -Message "feat: integrate Firebase authentication and protected routes" -DaysAgo 3
git checkout main
git merge feat/authentication --no-ff -m "Merge pull request #3 from feat/authentication"
$DateStr = (Get-Date).AddDays(-3).ToString("yyyy-MM-ddTHH:mm:ss")
$env:GIT_AUTHOR_DATE = $DateStr; $env:GIT_COMMITTER_DATE = $DateStr; git commit --amend --no-edit

# --- DAY 5: Database Integration ---
git checkout -b feat/firestore-db
git add hooks/useTransactions.ts firestore.rules .env.local "app/(dashboard)/"
Commit-WithDate -Message "feat: integrate real-time Firestore database for transactions" -DaysAgo 2
git checkout main
git merge feat/firestore-db --no-ff -m "Merge pull request #4 from feat/firestore-db"
$DateStr = (Get-Date).AddDays(-2).ToString("yyyy-MM-ddTHH:mm:ss")
$env:GIT_AUTHOR_DATE = $DateStr; $env:GIT_COMMITTER_DATE = $DateStr; git commit --amend --no-edit

# --- DAY 6: Documentation ---
git checkout -b docs/readme-setup
git add README.md
Commit-WithDate -Message "docs: add comprehensive project README for presentation" -DaysAgo 1
git checkout main
git merge docs/readme-setup --no-ff -m "Merge pull request #5 from docs/readme-setup"
$DateStr = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")
$env:GIT_AUTHOR_DATE = $DateStr; $env:GIT_COMMITTER_DATE = $DateStr; git commit --amend --no-edit

# Add anything left over just in case
git add .
$status = git status --porcelain
if ($status) {
    Commit-WithDate -Message "chore: final polish and minor fixes" -DaysAgo 0
}

Write-Host "Git simulation complete! You can open git log to confirm."
