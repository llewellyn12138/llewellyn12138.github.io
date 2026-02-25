@echo off
echo checking node environment...
node -v
if %errorlevel% neq 0 (
    echo Node.js is not found. Please install Node.js and restart the terminal/IDE.
    pause
    exit /b
)

cd blog-source
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting Hexo server...
echo You can access your blog at http://localhost:4000/blog/
call npx hexo server
pause
