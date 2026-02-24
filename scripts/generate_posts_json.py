import os
import json
import re
from datetime import datetime

# Get the absolute path of the script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Get the project root (parent of script dir)
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
# Define paths relative to project root
POSTS_DIR = os.path.join(PROJECT_ROOT, 'posts')
OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'posts.json')

print(f"Script Dir: {SCRIPT_DIR}")
print(f"Project Root: {PROJECT_ROOT}")
print(f"Posts Dir: {POSTS_DIR}")
print(f"Output File: {OUTPUT_FILE}")

def parse_frontmatter(content):
    """
    Parses YAML frontmatter from markdown content.
    Returns metadata dict and remaining content.
    """
    frontmatter_regex = r'^---\s*\n(.*?)\n---\s*\n'
    match = re.match(frontmatter_regex, content, re.DOTALL)
    
    metadata = {}
    if match:
        yaml_content = match.group(1)
        for line in yaml_content.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                metadata[key.strip()] = value.strip().strip('"\'')
        return metadata
    return {}

def main():
    posts = []
    
    if not os.path.exists(POSTS_DIR):
        print(f"Directory {POSTS_DIR} not found.")
        print(f"Current contents of {PROJECT_ROOT}:")
        try:
            print(os.listdir(PROJECT_ROOT))
        except:
            pass
        return

    # Walk through POSTS_DIR recursively
    for root, dirs, files in os.walk(POSTS_DIR):
        for filename in files:
            if filename.endswith('.md'):
                filepath = os.path.join(root, filename)
                
                # Get relative path for the JSON (e.g., 'coding/intro.md')
                rel_path = os.path.relpath(filepath, POSTS_DIR)
                # Normalize path separators to forward slashes for web compatibility
                rel_path = rel_path.replace('\\', '/')
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                except Exception as e:
                    print(f"Error reading {filepath}: {e}")
                    continue
                
                metadata = parse_frontmatter(content)
                
                # Fallback if no frontmatter
                if not metadata:
                    # Try to find first h1 header for title
                    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                    title = title_match.group(1) if title_match else filename.replace('.md', '')
                    
                    # Guess category from parent folder name or filename
                    parent_folder = os.path.basename(root)
                    if parent_folder != 'posts' and parent_folder:
                        category = parent_folder.lower()
                    else:
                        category = 'uncategorized'
                        if 'coding' in filename.lower(): category = 'coding'
                        elif 'ffmpeg' in filename.lower(): category = 'ffmpeg'
                        elif 'ug' in filename.lower(): category = 'ug'
                    
                    metadata = {
                        'title': title,
                        'category': category,
                        'date': datetime.now().strftime('%Y-%m-%d'),
                        'description': 'No description available.',
                        'image': 'images/logo.png' # Default image
                    }
                
                post_data = {
                    'filename': rel_path, # Use relative path here
                    'title': metadata.get('title', filename),
                    'category': metadata.get('category', 'uncategorized'),
                    'date': metadata.get('date', datetime.now().strftime('%Y-%m-%d')),
                    'description': metadata.get('description', ''),
                    'image': metadata.get('image', 'images/logo.png')
                }
                posts.append(post_data)

    # Sort posts by date (newest first)
    posts.sort(key=lambda x: x['date'], reverse=True)

    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(posts, f, ensure_ascii=False, indent=2)
        print(f"Successfully generated {OUTPUT_FILE} with {len(posts)} posts.")
    except Exception as e:
        print(f"Error writing to {OUTPUT_FILE}: {e}")

if __name__ == '__main__':
    main()
