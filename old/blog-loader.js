document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('posts-container');
    if (!container) return; // Exit if no container found

    // Get category filter from data attribute or URL param
    let category = container.getAttribute('data-category');
    if (!category) {
        const urlParams = new URLSearchParams(window.location.search);
        category = urlParams.get('category');
    }

    // Update title if elements exist
    if (category) {
        const titleMap = {
            'coding': '编程学习',
            'ffmpeg': 'FFmpeg',
            'ug': 'UG 建模'
        };
        const displayTitle = titleMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
        
        const pageTitle = document.getElementById('category-title');
        const breadcrumb = document.getElementById('breadcrumb-category');
        const sectionTitle = document.getElementById('section-title');
        
        if (pageTitle) pageTitle.textContent = displayTitle;
        if (breadcrumb) breadcrumb.textContent = displayTitle;
        if (sectionTitle) sectionTitle.textContent = displayTitle + ' 资源';
        document.title = displayTitle;
    }

    fetch('posts.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load posts.json');
            }
            return response.json();
        })
        .then(posts => {
            // Filter posts if category is specified
            const filteredPosts = category 
                ? posts.filter(post => post.category === category)
                : posts;

            if (filteredPosts.length === 0) {
                container.innerHTML = '<div class="col-12 text-center"><p>暂无文章。</p></div>';
                return;
            }

            let html = '';
            filteredPosts.forEach((post, index) => {
                // Alternate layout direction for visual variety (optional, matches original style)
                const isEven = index % 2 === 0;
                const flexClass = isEven ? '' : 'flex-row-reverse';
                const wowLeft = isEven ? 'fadeInLeft' : 'fadeInRight';
                const wowRight = isEven ? 'fadeInRight' : 'fadeInLeft';
                const paddingClass = isEven ? 'pl-xl-5' : 'pr-xl-5';

                html += `
                <!-- Post Item -->
                <div class="row row-50 justify-content-center align-items-center ${flexClass} mt-5">
                    <div class="col-md-10 col-lg-6 wow ${wowLeft}">
                        <a href="article.html?post=${post.filename}">
                            <img class="img-responsive rounded shadow-sm" src="${post.image}" alt="${post.title}" width="570" height="380" loading="lazy"/>
                        </a>
                    </div>
                    <div class="col-md-10 col-lg-6 wow ${wowRight}">
                        <div class="${paddingClass}">
                            <h3 class="heading-3"><a href="article.html?post=${post.filename}">${post.title}</a></h3>
                            <p class="big text-gray-800">${post.description}</p>
                            <a class="button button-lg button-primary" href="article.html?post=${post.filename}">阅读更多</a>
                        </div>
                    </div>
                </div>
                `;
            });

            container.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading posts:', error);
            container.innerHTML = '<div class="col-12 text-center"><p>加载文章列表失败，请稍后重试。</p></div>';
        });
});
