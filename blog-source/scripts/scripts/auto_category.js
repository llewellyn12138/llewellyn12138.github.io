var path = require('path');

hexo.extend.filter.register('before_post_render', function(data){
  // Only apply to posts, not pages
  if (data.layout !== 'post') return;

  // If categories are already set, do nothing
  if (data.categories && data.categories.length > 0) return;

  // Get the file path relative to the source/_posts directory
  // data.source looks like '_posts/category/post.md'
  var relativePath = data.source.substring('_posts/'.length);
  
  // Extract the directory name
  var dir = path.dirname(relativePath);

  // If the post is in a subdirectory (not directly in _posts)
  if (dir !== '.') {
    // Split directory by separator to handle nested categories if needed
    // For now, just use the immediate parent folder as the category
    // or the full path as hierarchical categories
    var categories = dir.split(path.sep);
    
    // Set the categories
    data.setCategories(categories);
  }
});
