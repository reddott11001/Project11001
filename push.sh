# Check git status and execute push if needed
$status = git status
Write-Host "Current git status:"
Write-Host $status

# Check if there are any changes
if ($status -match "working tree clean") {
    Write-Host "Working tree is clean - nothing to commit"
} elseif ($status -match "working directory") {
    Write-Host ""
    Write-Host "Creating git credentials..."
    Write-Host ""
    
    # Configure git user
    git config user.name "openhands"
    git config user.email "openhands@all-hands.dev"
    Write-Host "Set git user to: openhands <openhands@all-hands.dev>"
    Write-Host ""
    
    # Add all files
    git add .
    Write-Host "Added all files to staging area"
    Write-Host ""
    
    # Commit changes
    git commit -m "update abil dari github dan push ke folder ini

- Added full-featured Settings app with Windows 11-style interface
- Fixed navigation bar layout issues
- Fixed power menu overlap problem
- Updated malware guide with RAT information
- Made it work in Chrome if not in Toolbox by fixing checksum errors
- Now only 2 games are pre-installed (Tetris and Street Fighter)"
    Write-Host "Committed changes"
    Write-Host ""
    
    # Push to GitHub
    $remoteUrl = git remote get-url origin
    Write-Host "Current remote URL: $remoteUrl"
    Write-Host ""
    Write-Host "Pushing to remote repository..."
    git push -u origin main
    Write-Host ""
    Write-Host "Push complete!"
}
