# Check for .env file
if (-not (Test-Path "backend\.env")) {
    Write-Host "Warning: backend\.env not found. Copying form .env.example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Green
pip install -r backend\requirements.txt

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Green
python backend\manage.py migrate

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Green
npm install

# Start servers
Write-Host "Starting servers..." -ForegroundColor Green
Start-Process "python" -ArgumentList "backend\manage.py runserver" -NoNewWindow
Start-Process "npm" -ArgumentList "run dev" -NoNewWindow
