#!/usr/bin/env bash

# -----------------------------------------------------
# fix-escaped-jsx.sh
# Auto-fix escaped JSX entities in targeted TSX files.
# Linux-safe (GNU sed). Backup included.
# -----------------------------------------------------

set -e

TARGET_FILES=(
  "app/components/layout/dashboard-layout.tsx"
  "app/routes/dashboard.admin.tsx"
  "app/routes/dashboard.auditor.tsx"
  "app/routes/dashboard.guide.tsx"
  "app/routes/dashboard.user.tsx"
  "app/components/navigation/protected-route.tsx"
)

echo "🔎 Starting JSX escape cleanup..."

# Create backup folder
BACKUP_DIR="backup_jsx_fix_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📂 Backing up files to: $BACKUP_DIR"

# Backup each file
for file in "${TARGET_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$BACKUP_DIR"/
    echo "  ✔ Backed up $file"
  else
    echo "  ⚠ WARNING: $file not found (skipping)"
  fi
done

echo ""
echo "🛠 Applying fixes..."

# Apply transformations
for file in "${TARGET_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    sed -i \
      -e 's/&amp;lt;/</g' \
      -e 's/&amp;gt;/>/g' \
      -e 's/&amp;amp;/&/g' \
      "$file"

    echo "  ✔ Fixed $file"
  fi
done

echo ""
echo "✅ Done! All escaped JSX entities have been corrected."
echo "📁 A full backup is stored at: $BACKUP_DIR"
echo ""
echo "Tip: Run this script anytime you accidentally paste escaped HTML into TSX."
