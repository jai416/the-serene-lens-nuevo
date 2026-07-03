#!/bin/bash
# Download real skincare product images from Unsplash
# All images are free to use under the Unsplash License

DIR="/home/jai/theserene/public/images/products"
mkdir -p "$DIR"

# Unsplash photo IDs that are skincare product related
PHOTOS=(
  "P9F7bJuy388"  # white and yellow tube bottle - skincare
  "GjJZ5HBl2qQ"  # bottle with dropper on yellow - serum
  "Q0uwqgLzgMw"  # skincare product bottle
  "03Ec6VqfbfM"  # skincare product - Harper Sunday
  "nC9rUC7Oyfk"  # cosmetic product - Cosmin Ursea
  "D44p6Ubx-9E"  # skincare - Rafly Alfaridzy
  "hFc2dPjoyM4"  # skincare bottle - Isaac Wolff
  "gtxxkGEoaBM"  # skincare - Muhammad Sulyman
  "bnesx-JWQoY"  # cosmetic mockup
  "dfocKTrQQ9Y"  # skincare product - Sanju Pandita
  "L9KQmudPdJo"  # skincare - Traci Milimo
  "IWuc9YiChSI"  # skincare product - Tiffany Oakley
  "zmkKlDc9mY0"  # skincare product - Tiffany Oakley
  "2N-tGc7r4QQ"  # skincare - Natallia Photo
  "hv4SgMmR4U0"  # skincare product - Ela De Pure
  "5kqhnnEGhTc"  # skincare product - Ela De Pure
  "cq1zGLQIFyA"  # skincare - Content Pixie
  "TczKr5LWuJ0"  # skincare product - Maria Lupan
  "Z3EgVe0EOGs"  # skincare product - Maria Lupan
  "yWt6nVTPuQI"  # skincare product - The Design Lady
  "9YDpRItImkM"  # skincare - Cherrydeck
  "RAF4W9aqajY"  # skincare - Cherrydeck
)

echo "Downloading ${#PHOTOS[@]} skincare product images from Unsplash..."

for i in "${!PHOTOS[@]}"; do
  id="${PHOTOS[$i]}"
  filename="product-$(printf '%02d' $((i+1))).jpg"
  echo "[$((i+1))/${#PHOTOS[@]}] Downloading $id -> $filename"
  curl -sL -o "$DIR/$filename" "https://unsplash.com/photos/$id/download?force=true" &
  # Limit concurrent downloads
  if [ $(( (i+1) % 5 )) -eq 0 ]; then
    wait
  fi
done

wait
echo "Done! Downloaded ${#PHOTOS[@]} images to $DIR"
ls -la "$DIR"
