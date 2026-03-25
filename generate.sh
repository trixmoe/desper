#!/bin/bash
# Generates a desper content JSON file from a directory of media files.
# Intended for use in a cronjob to automatically keep slides up to date.
# Usage: $0 <directory> <output.json>
set -e

DIR="${1:?Usage: $0 <directory> <output.json>}"
OUT="${2:?Usage: $0 <directory> <output.json>}"

URL_PREFIX=$(basename "$DIR")

# Collect all files in directory (already sorted)
files=()
for path in "$DIR"/*; do
    if [[ -f "$path" ]]; then
        files+=("$(basename "$path")")
    fi
done

# Build slides by grouping files that share the same numeric prefix (e.g. "01")
# Files without a numeric prefix are each their own slide
slides='[]'
last_prefix=""
urls='[]'

for f in "${files[@]}"; do
    # Grab slide prefix (e.g. 01) of current file
    if [[ "$f" =~ ^([0-9]+) ]]; then
        prefix="${BASH_REMATCH[1]}"
    else
        prefix="$f"
    fi

    # When the prefix changes (new slide), flush the previous URLs as a new slide
    if [[ "$prefix" != "$last_prefix" && -n "$last_prefix" ]]; then
        slides=$(jq --argjson u "$urls" '. + [{"urls": $u}]' <<< "$slides")
        urls='[]'
    fi
    last_prefix="$prefix"

    # .txt files contain a URL to use; all other files are served by path
    if [[ "$f" == *.txt ]]; then
        url=$(< "$DIR/$f")
    else
        url="$URL_PREFIX/$f"
    fi
    urls=$(jq --arg u "$url" '. + [$u]' <<< "$urls")
done

# Flush the final slide
if [[ -n "$last_prefix" ]]; then
    slides=$(jq --argjson u "$urls" '. + [{"urls": $u}]' <<< "$slides")
fi

# Check if slides exist and if they're the same content, if yes, we don't write anything.
if [[ -f "$OUT" ]]; then
    existing=$(jq -c '.slides' "$OUT" 2>/dev/null)
    [[ "$existing" == "$(jq -c '.' <<< "$slides")" ]] && exit 0
fi

# Only write the file (and update lastChange) if the slides have actually changed
jq -n --argjson slides "$slides" --arg ts "$(date +%s)" \
    '{"formatVersion":"0","lastChange":$ts,"slides":$slides}' > "$OUT"
