# Script to set Vercel environment variables
param($Token)

# Encode the URLs (PowerShell handles special chars better when quoted)
$DATABASE_URL = 'postgresql://neondb_owner:npg_B0UFsrcKqx1M@ep-polished-cake-abje7rly-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
$DIRECT_URL = 'postgresql://neondb_owner:npg_B0UFsrcKqx1M@ep-polished-cake-abje7rly.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
$NEXTAUTH_SECRET = '7e8a9b2c3d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4g'
$NEXTAUTH_URL = 'https://educa-solutions.vercel.app'

Write-Host "Setting DATABASE_URL..."
echo $DATABASE_URL | vercel env add DATABASE_URL production --yes --token $Token

Write-Host "Setting DIRECT_URL..."
echo $DIRECT_URL | vercel env add DIRECT_URL production --yes --token $Token

Write-Host "Setting NEXTAUTH_SECRET..."
echo $NEXTAUTH_SECRET | vercel env add NEXTAUTH_SECRET production --yes --token $Token

Write-Host "Setting NEXTAUTH_URL..."
echo $NEXTAUTH_URL | vercel env add NEXTAUTH_URL production --yes --token $Token

Write-Host "Done!"
