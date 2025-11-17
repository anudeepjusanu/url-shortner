#!/bin/bash

###############################################################################
# Database Restore Script
#
# This script restores a MongoDB database from a backup file.
#
# Usage:
#   ./scripts/restore-database.sh [backup-file]
#   ./scripts/restore-database.sh backup_url-shortener_20240115_120000.tar.gz
#
# Or restore from S3:
#   S3_RESTORE=true ./scripts/restore-database.sh backup_url-shortener_20240115_120000.tar.gz
#
# Environment Variables:
#   MONGO_URI     - MongoDB connection URI (default: from .env)
#   BACKUP_DIR    - Directory containing backups (default: ./backups)
#   S3_BUCKET     - Optional: S3 bucket for cloud backup
#   AWS_REGION    - Optional: AWS region (default: us-east-1)
#   S3_RESTORE    - Set to 'true' to download from S3
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-url-shortener}"
TEMP_DIR="${BACKUP_DIR}/temp_restore"

echo -e "${GREEN}===========================================\n${NC}"
echo -e "${GREEN}   MongoDB Restore Script\n${NC}"
echo -e "${GREEN}===========================================\n${NC}"

# Check if mongorestore is installed
if ! command -v mongorestore &> /dev/null; then
    echo -e "${RED}❌ Error: mongorestore is not installed${NC}"
    echo "Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

# Get backup file
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Available backups:"
    echo
    ls -lh "${BACKUP_DIR}"/backup_${DB_NAME}_*.tar.gz 2>/dev/null || echo "No backups found"
    echo
    read -p "Enter backup filename to restore: " BACKUP_FILE
fi

# Download from S3 if requested
if [ "$S3_RESTORE" = "true" ]; then
    if [ -z "$S3_BUCKET" ]; then
        echo -e "${RED}❌ Error: S3_BUCKET not set${NC}"
        exit 1
    fi

    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ Error: AWS CLI not installed${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Downloading backup from S3...${NC}"
    AWS_REGION="${AWS_REGION:-us-east-1}"
    S3_PATH="s3://${S3_BUCKET}/backups/${DB_NAME}/${BACKUP_FILE}"

    aws s3 cp "${S3_PATH}" "${BACKUP_DIR}/${BACKUP_FILE}" --region "${AWS_REGION}"

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to download from S3${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Downloaded from S3${NC}\n"
fi

# Check if backup file exists
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

if [ ! -f "$BACKUP_PATH" ]; then
    echo -e "${RED}❌ Error: Backup file not found: ${BACKUP_PATH}${NC}"
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"
echo "Database: ${DB_NAME}"
echo "Backup file: ${BACKUP_FILE}"
echo
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ] && [ "$CONFIRM" != "y" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Create temp directory
mkdir -p "${TEMP_DIR}"

# Extract backup
echo -e "\n${YELLOW}Extracting backup...${NC}"
tar -xzf "${BACKUP_PATH}" -C "${TEMP_DIR}"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to extract backup${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

echo -e "${GREEN}✅ Extraction completed${NC}"

# Find the backup directory
BACKUP_NAME=$(basename "${BACKUP_FILE}" .tar.gz)
EXTRACT_PATH="${TEMP_DIR}/${BACKUP_NAME}"

if [ ! -d "$EXTRACT_PATH" ]; then
    echo -e "${RED}❌ Error: Extracted backup directory not found${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Perform restore
echo -e "\n${YELLOW}Restoring database...${NC}"

if [ -n "$MONGO_URI" ]; then
    # Use MongoDB URI
    echo "Using MongoDB URI from environment"
    mongorestore --uri="${MONGO_URI}" --gzip --drop "${EXTRACT_PATH}"
else
    # Use default local MongoDB
    echo "Using default MongoDB connection (localhost:27017)"
    mongorestore --db="${DB_NAME}" --gzip --drop "${EXTRACT_PATH}/${DB_NAME}"
fi

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Database restored successfully${NC}"
else
    echo -e "\n${RED}❌ Restore failed${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Cleanup
echo -e "\n${YELLOW}Cleaning up...${NC}"
rm -rf "${TEMP_DIR}"
echo -e "${GREEN}✅ Cleanup completed${NC}"

# Summary
echo -e "\n${GREEN}===========================================\n${NC}"
echo -e "${GREEN}   Restore Summary\n${NC}"
echo -e "${GREEN}===========================================\n${NC}"
echo "Database: ${DB_NAME}"
echo "Restored from: ${BACKUP_FILE}"
echo
echo -e "${GREEN}✅ Restore process completed successfully!${NC}\n"

exit 0
