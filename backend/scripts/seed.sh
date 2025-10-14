#!/bin/bash

# Database Seeding Script
# This script seeds the database with initial data

echo "Starting database seeding..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

# Run basic seeding
echo "Running basic database seeding..."
node scripts/seed.js

if [ $? -eq 0 ]; then
    echo "✅ Basic database seeding completed successfully"
else
    echo "❌ Basic database seeding failed"
    exit 1
fi

# Ask if user wants to run faker seeding
read -p "Do you want to run faker seeding with sample data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running faker seeding..."
    node seeders/seed_all.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Faker seeding completed successfully"
    else
        echo "❌ Faker seeding failed"
        exit 1
    fi
fi

echo "✅ Database seeding completed"
