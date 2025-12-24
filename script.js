document.addEventListener('DOMContentLoaded', () => {
    /** Configuration */
    const config = {
        youtubePlaylistId: 'PLe3o60ftnUsseZal7vYvoQaLlry-9niVW',
        githubUsername: 'CreativeMindstorms',
        email: 'info@robalink.com',
        socials: {
            linkedin: 'https://linkedin.com/company/robalink',
        },
        videosToShow: 3,
        reposToShow: 3
    };

    /** Initialization */
    populateDynamicContent(config);
    populateContactEmails(config);
    setupMobileMenu();
    updateCopyrightYear();

    // Initialize Visuals
    new NetworkBackground('network-bg');
    new CodeTypewriter('typewriter-code');

    /** Data Fetching */
    if (config.youtubePlaylistId) {
        fetchYouTubeVideos(config.youtubePlaylistId, config.videosToShow);
    }
    if (config.githubUsername) {
        fetchGitHubRepos(config.githubUsername, config.reposToShow);
    }
});

/**
 * Populates static contact info and socials from config
 */
function populateDynamicContent(conf) {
    const socialContainer = document.getElementById('social-icons');
    if (socialContainer) {
        const iconMap = {
            youtube: 'fa-youtube',
            instagram: 'fa-instagram',
            github: 'fa-github',
            linkedin: 'fa-linkedin-in'
        };

        socialContainer.innerHTML = '';
        for (const [platform, url] of Object.entries(conf.socials)) {
            if (url && url !== '') {
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.setAttribute('aria-label', platform);
                link.innerHTML = `<i class="fab ${iconMap[platform]}"></i>`;
                socialContainer.appendChild(link);
            }
        }
    }
}

/**
 * Populates static contact info
 */
function populateContactEmails(conf) {
    const emailRef = document.getElementById('contact-email');
    if (emailRef) {
        emailRef.href = `mailto:${conf.email}`;
        emailRef.textContent = conf.email;
    }
}

function updateCopyrightYear() {
    document.getElementById('year').textContent = new Date().getFullYear();
}

/**
 * Mobile Menu Toggle
 */
function setupMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = '#fff';
                navLinks.style.padding = '1rem';
                navLinks.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
            }
        });
    }
}

/**
 * Fetch YouTube Videos (RSS to JSON)
 */
async function fetchYouTubeVideos(playlistId, videosToShow) {
    const videoGrid = document.getElementById('video-grid');
    if (!videoGrid) return;

    // Fetch RSS feed via rss2json
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status !== 'ok') throw new Error('Failed to fetch YouTube feed');

        videoGrid.innerHTML = '';
        const videos = data.items.slice(0, videosToShow);

        if (videos.length === 0) {
            videoGrid.innerHTML = '<p class="error-text">No videos found.</p>';
            return;
        }

        videos.forEach(video => {
            const videoId = video.link.split('v=')[1];
            // Fallback to high quality thumbnail
            const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;

            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <a href="${video.link}" target="_blank" rel="noopener noreferrer">
                    <div class="video-thumbnail"><img src="${thumbUrl}" alt="${video.title}" loading="lazy"></div>
                    <div class="video-info"><h4>${video.title}</h4></div>
                </a>`;
            videoGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching videos:', error);
        videoGrid.innerHTML = '<p>Check out our channel on YouTube!</p>';
    }
}

/**
 * Fetch GitHub Repos (Direct API)
 */
async function fetchGitHubRepos(username, reposToShow) {
    const repoGrid = document.getElementById('repo-grid');
    if (!repoGrid) return;

    if (!repoGrid) return;

    // Fetch repositories from GitHub API
    const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=${reposToShow}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch GitHub repos');

        const data = await response.json();

        if (data.length === 0) {
            repoGrid.innerHTML = '<p>No public repositories found.</p>';
            return;
        }

        repoGrid.innerHTML = '';
        data.forEach(repo => {
            const description = repo.description || 'No description available.';
            const shortDesc = description.length > 100 ? description.substring(0, 97) + '...' : description;

            const card = document.createElement('a');
            card.className = 'repo-card';
            card.href = repo.html_url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';

            card.innerHTML = `
                <h4><i class="fab fa-github"></i> ${repo.name}</h4>
                <p>${shortDesc}</p>`;
            repoGrid.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching repos:', error);
        repoGrid.innerHTML = '<p>Check out our GitHub profile!</p>';
    }
}
