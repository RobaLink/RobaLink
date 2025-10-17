document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const config = {
        youtubePlaylistId: 'PLe3o60ftnUsseZal7vYvoQaLlry-9niVW',
        githubUsername: 'CreativeMindstorms',
        email: 'info@robalink.com',
        logoSvg: 'logo.svg',
        faviconSvg: 'favicon.svg',
        socials: {
            youtube: 'https://www.youtube.com/c/CreativeMindstorms',
            instagram: 'https://www.instagram.com/creative_mindstorms/',
            github: 'https://github.com/CreativeMindstorms',
            linkedin: 'YOUR_LINKEDIN_URL_HERE'
        },
        videosToShow: 6,
        reposToShow: 3 // The number of recent unique repos to find and display
    };

    // --- INITIALIZE SITE ---
    populateSiteIdentity(config);
    populateContactInfo(config);

    if (config.youtubePlaylistId) {
        fetchYouTubeVideos(config.youtubePlaylistId, config.videosToShow);
    } else {
        document.getElementById('video-grid').innerHTML = '<p class="error-text">YouTube Playlist ID is not configured.</p>';
    }

    if (config.githubUsername) {
        fetchGitHubRepos(config.githubUsername, config.reposToShow);
    } else {
        document.getElementById('repo-grid').innerHTML = '<p class="error-text">GitHub username is not configured.</p>';
    }

    document.getElementById('year').textContent = new Date().getFullYear();
});

function populateSiteIdentity(conf) {
    document.getElementById('logo-link').innerHTML = `<img src="${conf.logoSvg}" alt="RobaLink Logo">`;
    document.getElementById('favicon-svg').href = conf.faviconSvg;
}

function populateContactInfo(conf) {
    const emailLink = document.getElementById('contact-email');
    emailLink.href = `mailto:${conf.email}`;
    emailLink.textContent = conf.email;

    const socialContainer = document.getElementById('social-icons');
    const iconMap = { youtube: 'fa-youtube', instagram: 'fa-instagram', github: 'fa-github', linkedin: 'fa-linkedin-in' };
    socialContainer.innerHTML = '';
    for (const [platform, url] of Object.entries(conf.socials)) {
        if (url && url !== '' && !url.includes('_URL_HERE')) {
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

async function fetchYouTubeVideos(playlistId, videosToShow) {
    const videoGrid = document.getElementById('video-grid');
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.status !== 'ok') throw new Error('Failed to fetch YouTube feed');
        
        videoGrid.innerHTML = '';
        const videos = data.items.slice(0, videosToShow);

        if (videos.length === 0) {
            videoGrid.innerHTML = '<p class="error-text">No videos found in the playlist.</p>';
            return;
        }

        videos.forEach(video => {
            const videoId = video.link.split('v=')[1];
            const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
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
        videoGrid.innerHTML = '<p class="error-text">Could not load videos.</p>';
    }
}

// --- FINAL GITHUB REPO LOGIC ---
async function fetchGitHubRepos(username, reposToShow) {
    const repoGrid = document.getElementById('repo-grid');
    
    // --- Phase 1: Discover recent repository names from the RSS feed ---
    const atomUrl = `https://github.com/${username}.atom`;
    const rssApiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(atomUrl)}`;
    
    let recentRepoNames = [];
    try {
        const response = await fetch(rssApiUrl);
        const data = await response.json();
        if (data.status !== 'ok') throw new Error('Failed to fetch GitHub feed');

        const uniqueRepoNames = new Set();
        const repoRegex = /github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/;

        for (const item of data.items) {
            const match = item.link.match(repoRegex);
            if (match && match[1]) {
                uniqueRepoNames.add(match[1]); // e.g., "CreativeMindstorms/AI-LEGO-HEAD"
                if (uniqueRepoNames.size >= reposToShow) break;
            }
        }
        recentRepoNames = Array.from(uniqueRepoNames);

    } catch (error) {
        console.error('Error discovering repos from feed:', error);
        repoGrid.innerHTML = '<p class="error-text">Could not load repository feed.</p>';
        return;
    }

    if (recentRepoNames.length === 0) {
        repoGrid.innerHTML = '<p class="error-text">No recent public repositories found.</p>';
        return;
    }

    // --- Phase 2: Enrich those repositories with details from the GitHub API ---
    repoGrid.innerHTML = ''; // Clear loading text
    for (const fullName of recentRepoNames) {
        const apiUrl = `https://api.github.com/repos/${fullName}`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Repo not found: ${fullName}`);
            const data = await response.json();

            const description = data.description || 'No description available.';
            const shortDesc = description.length > 150 ? description.substring(0, 147) + '...' : description;

            const card = document.createElement('div');
            card.className = 'repo-card';
            card.innerHTML = `
                <a href="${data.html_url}" target="_blank" rel="noopener noreferrer">
                    <h4><i class="fab fa-github"></i> ${data.name}</h4>
                </a>
                <p>${shortDesc}</p>`;
            repoGrid.appendChild(card);

        } catch (error) {
            console.error(`Failed to fetch repo details for ${fullName}:`, error);
        }
    }
}