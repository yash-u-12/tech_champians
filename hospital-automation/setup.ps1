# Hospital Automation Setup Script

Write-Host "🏥 Setting up Hospital Automation System..." -ForegroundColor Cyan
Write-Host ""

# Navigate to hospital-automation directory
Set-Location hospital-automation

# Check if .env.local exists
if (!(Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "✅ Created .env.local - Please update with your API keys" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
    Write-Host ""
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Success message
Write-Host "✅ Hospital Automation System setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env.local and add your GEMINI_API_KEY"
Write-Host "2. Run 'npm start' to start the automation system"
Write-Host "3. Run 'npm test' to test the workflows"
Write-Host "4. Access dashboard at http://localhost:3001/hospital-automation/dashboard"
Write-Host ""
