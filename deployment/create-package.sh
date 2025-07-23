#!/bin/bash

# Create deployment package archive

echo "Creating deployment package..."

# Parse arguments
INCLUDE_INSTALLERS=false
QUICK_PACKAGE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --with-installers)
            INCLUDE_INSTALLERS=true
            shift
            ;;
        --quick)
            QUICK_PACKAGE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--with-installers] [--quick]"
            echo "  --with-installers  Include Docker and Node.js installers (large package)"
            echo "  --quick           Create package without installers"
            exit 1
            ;;
    esac
done

# Create temp directory
TEMP_DIR=$(mktemp -d)
PACKAGE_NAME="contracts-saas-deployment-$(date +%Y%m%d-%H%M%S)"

# Copy necessary files
echo "Copying files..."
mkdir -p "$TEMP_DIR/$PACKAGE_NAME"

# Copy deployment files
cp -r . "$TEMP_DIR/$PACKAGE_NAME/deployment"

# Copy source code
cp -r ../server "$TEMP_DIR/$PACKAGE_NAME/"
cp -r ../client "$TEMP_DIR/$PACKAGE_NAME/"
cp ../package.json "$TEMP_DIR/$PACKAGE_NAME/" 2>/dev/null || true
cp ../package-lock.json "$TEMP_DIR/$PACKAGE_NAME/" 2>/dev/null || true

# Remove unnecessary files
echo "Cleaning up..."
find "$TEMP_DIR/$PACKAGE_NAME" -name "node_modules" -type d -prune -exec rm -rf {} +
find "$TEMP_DIR/$PACKAGE_NAME" -name ".git" -type d -prune -exec rm -rf {} +
find "$TEMP_DIR/$PACKAGE_NAME" -name "dist" -type d -prune -exec rm -rf {} +
find "$TEMP_DIR/$PACKAGE_NAME" -name "build" -type d -prune -exec rm -rf {} +
find "$TEMP_DIR/$PACKAGE_NAME" -name ".env" -type f -delete
find "$TEMP_DIR/$PACKAGE_NAME" -name "*.log" -type f -delete

# Handle installers
if [[ "$INCLUDE_INSTALLERS" == true ]]; then
    echo "Including installers in package..."
    # Check if installers exist, if not download them
    if [ ! -d "installers" ] || [ -z "$(ls -A installers 2>/dev/null)" ]; then
        echo "Downloading installers first..."
        ./download-installers.sh
    fi
elif [[ "$QUICK_PACKAGE" != true ]]; then
    # Remove installers directory for standard package
    rm -rf "$TEMP_DIR/$PACKAGE_NAME/deployment/installers"
fi

# Create archive
echo "Creating archive..."
cd "$TEMP_DIR"

if [[ "$INCLUDE_INSTALLERS" == true ]]; then
    PACKAGE_NAME="${PACKAGE_NAME}-with-installers"
fi

tar -czf "$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME"

# Move to original directory
mv "$PACKAGE_NAME.tar.gz" "$OLDPWD/"

# Cleanup
rm -rf "$TEMP_DIR"

# Calculate size
PACKAGE_SIZE=$(du -h "$PACKAGE_NAME.tar.gz" | cut -f1)

echo ""
echo "✅ Deployment package created: $PACKAGE_NAME.tar.gz"
echo "📦 Package size: $PACKAGE_SIZE"
echo ""
echo "To deploy:"
echo "1. Extract the archive: tar -xzf $PACKAGE_NAME.tar.gz"
echo "2. Navigate to the directory: cd $PACKAGE_NAME/deployment"
echo "3. Run enhanced setup: ./setup-with-deps.sh"
echo "   (or standard setup: ./setup.sh)"