#!/bin/bash

###############################################################################
# Database Backup Script
#
# This script creates a backup of the MongoDB database with compression
# and optional upload to cloud storage.
#
# Usage:
#   ./scripts/backup-database.sh
#
# Environment Variables:
#   MONGO_URI         - MongoDB connection URI (default: from .env)
#   BACKUP_DIR        - Directory to store backups (default: ./backups)
#   BACKUP_RETENTION  - Number of days to keep backups (default: 30)
#   S3_BUCKET         - Optional: S3 bucket for cloud backup
#   AWS_REGION        - Optional: AWS region (default: us-east-1)
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
BACKUP_RETENTION="${BACKUP_RETENTION:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_NAME:-url-shortener}"
BACKUP_NAME="backup_${DB_NAME}_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo -e "${GREEN}===========================================\n${NC}"
echo -e "${GREEN}   MongoDB Backup Script\n${NC}"
echo -e "${GREEN}===========================================\n${NC}"

# Check if mongodump is installed
if ! command -v mongodump &> /dev/null; then
    echo -e "${RED}❌ Error: mongodump is not installed${NC}"
    echo "Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

echo -e "${YELLOW}Starting backup...${NC}"
echo "Database: ${DB_NAME}"
echo "Backup location: ${BACKUP_PATH}"
echo

# Perform backup
if [ -n "$MONGO_URI" ]; then
    # Use MongoDB URI
    echo "Using MongoDB URI from environment"
    mongodump --uri="${MONGO_URI}" --out="${BACKUP_PATH}" --gzip
else
    # Use default local MongoDB
    echo "Using default MongoDB connection (localhost:27017)"
    mongodump --db="${DB_NAME}" --out="${BACKUP_PATH}" --gzip
fi

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Backup completed successfully${NC}"
else
    echo -e "\n${RED}❌ Backup failed${NC}"
    exit 1
fi

# Create a tarball of the backup
echo -e "\n${YELLOW}Compressing backup...${NC}"
tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Compression completed${NC}"
    # Remove uncompressed backup
    rm -rf "${BACKUP_PATH}"
else
    echo -e "${RED}❌ Compression failed${NC}"
    exit 1
fi

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_PATH}.tar.gz" | cut -f1)
echo "Backup size: ${BACKUP_SIZE}"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    echo -e "\n${YELLOW}Uploading to S3...${NC}"

    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo -e "${YELLOW}⚠️  AWS CLI not installed. Skipping S3 upload.${NC}"
    else
        AWS_REGION="${AWS_REGION:-us-east-1}"
        S3_PATH="s3://${S3_BUCKET}/backups/${DB_NAME}/${BACKUP_NAME}.tar.gz"

        aws s3 cp "${BACKUP_PATH}.tar.gz" "${S3_PATH}" --region "${AWS_REGION}"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Uploaded to S3: ${S3_PATH}${NC}"
        else
            echo -e "${RED}❌ S3 upload failed${NC}"
        fi
    fi
fi

# Clean up old backups
echo -e "\n${YELLOW}Cleaning up old backups (retention: ${BACKUP_RETENTION} days)...${NC}"
find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.tar.gz" -type f -mtime +${BACKUP_RETENTION} -delete

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cleanup completed${NC}"
fi

# Summary
echo -e "\n${GREEN}===========================================\n${NC}"
echo -e "${GREEN}   Backup Summary\n${NC}"
echo -e "${GREEN}===========================================\n${NC}"
echo "Backup file: ${BACKUP_NAME}.tar.gz"
echo "Size: ${BACKUP_SIZE}"
echo "Location: ${BACKUP_PATH}.tar.gz"
if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    echo "S3 location: ${S3_PATH}"
fi
echo
echo -e "${GREEN}✅ Backup process completed successfully!${NC}\n"

exit 0
