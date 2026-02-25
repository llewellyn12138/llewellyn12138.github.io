document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('knowledge-container');
    if (!container) return;

    fetch('posts.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load posts');
            return response.json();
        })
        .then(posts => {
            const categories = {};
            
            // Group posts by category to find representative image
            posts.forEach(post => {
                if (!categories[post.category]) {
                    categories[post.category] = {
                        name: post.category,
                        image: post.image, // Use the image of the newest post
                        count: 0
                    };
                }
                categories[post.category].count++;
            });

            // Config for known categories (custom titles and icons)
            const categoryConfig = {
                'ug': { title: 'UG 建模', icon: 'mdi-cube-outline', link: 'ug.html' },
                'ffmpeg': { title: 'FFmpeg', icon: 'mdi-video', link: 'ffmpeg.html' },
                'coding': { title: '编程学习', icon: 'mdi-code-tags', link: 'coding.html' }
            };

            let html = '';
            // Sort categories to keep consistent order (known first, then alphabetical)
            const sortedKeys = Object.keys(categories).sort((a, b) => {
                const aKnown = !!categoryConfig[a];
                const bKnown = !!categoryConfig[b];
                if (aKnown && !bKnown) return -1;
                if (!aKnown && bKnown) return 1;
                return a.localeCompare(b);
            });

            sortedKeys.forEach((key, index) => {
                const cat = categories[key];
                const config = categoryConfig[key] || { 
                    title: key.charAt(0).toUpperCase() + key.slice(1), 
                    icon: 'mdi-folder-outline', 
                    link: `category.html?category=${key}` 
                };
                
                // Animation direction alternation
                const wowClass = index % 2 === 0 ? 'slideInUp' : 'slideInDown';

                html += `
                <div class="col-sm-6 col-lg-4">
                  <div class="oh-desktop">
                    <article class="services-terri wow ${wowClass}">
                      <div class="services-terri-figure">
                        <a href="${config.link}">
                          <img src="${cat.image}" alt="${config.title}" loading="lazy" style="width: 100%; aspect-ratio: 4/3; object-fit: cover;"/>
                        </a>
                      </div>
                      <div class="services-terri-caption">
                        <a class="services-terri-icon mdi ${config.icon}" href="${config.link}"></a>
                        <h5 class="services-terri-title"><a href="${config.link}">${config.title}</a></h5>
                      </div>
                    </article>
                  </div>
                </div>
                `;
            });

            if (html === '') {
                container.innerHTML = '<div class="col-12 text-center"><p>暂无分类。</p></div>';
            } else {
                container.innerHTML = html;
            }
        })
        .catch(error => {
            console.error(error);
            container.innerHTML = '<div class="col-12 text-center"><p>加载失败，请刷新重试。</p></div>';
        });
});
