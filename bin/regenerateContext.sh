DEST_FOLDER=~/Desktop/multiplication-tables
mkdir -p "$DEST_FOLDER"
rm -rf "$DEST_FOLDER"/*

tree /Users/ramiroaraujo/Development/multiplication-tables/src > "$DEST_FOLDER/src-tree.txt"

# @todo add git log

cp /Users/ramiroaraujo/Development/multiplication-tables/src/app/layout.tsx "$DEST_FOLDER/"
cp /Users/ramiroaraujo/Development/multiplication-tables/src/app/page.tsx "$DEST_FOLDER/"
cp /Users/ramiroaraujo/Development/multiplication-tables/src/lib/game.ts "$DEST_FOLDER/"
cp /Users/ramiroaraujo/Development/multiplication-tables/src/lib/provinces.ts "$DEST_FOLDER/"
cp /Users/ramiroaraujo/Development/multiplication-tables/src/lib/utils.ts "$DEST_FOLDER/"
cp /Users/ramiroaraujo/Development/multiplication-tables/package.json "$DEST_FOLDER/"

open "$DEST_FOLDER"
