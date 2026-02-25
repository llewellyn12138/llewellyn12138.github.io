const path = require('path');

hexo.extend.filter.register('before_post_render', function(data){
  if (data.layout !== 'post') return;
  if (data.categories && data.categories.length > 0) return;

  var source = data.source;
  var separator = path.sep;
  
  // Normalize separators to forward slash for consistency if needed, but path.sep handles OS
  
  // data.source is like _posts/category/post.md
  // We want to skip '_posts/'
  var parts = source.split(separator);
  
  // Check if it starts with _posts
  if (parts[0] !== '_posts') return;
  
  // Remove filename
  parts.pop();
  
  // Remove _posts
  parts.shift();
  
  // If parts is empty, it's in root of _posts
  if (parts.length === 0) return;
  
  // Set categories
  data.setCategories(parts);
});
