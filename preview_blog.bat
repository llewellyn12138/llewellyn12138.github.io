@echo off
echo checking node environment...
node -v
if %errorlevel% neq 0 (
    echo Node.js is not found. Please install Node.js and restart the terminal/IDE.
    pause
    exit /b
)

echo Syncing posts from 'posts' folder to blog source...
if exist "blog-source\source\_posts" (
    rmdir /s /q "blog-source\source\_posts"
)
mkdir "blog-source\source\_posts"
xcopy "posts" "blog-source\source\_posts" /s /e /y /i

cd blog-source
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting Hexo server...
echo You can access your blog at http://localhost:4000/blog/
call npx hexo server
pause
