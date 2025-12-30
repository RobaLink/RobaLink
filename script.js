'use strict';

/**
 * Main Application Script
 */
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

    // Initialize Language
    initLanguage();

    // Initialize Visuals
    new NetworkBackground('network-bg');

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

/**
 * Mobile Menu Toggle
 */
function setupMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        // Toggle menu visibility
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
        });

        // Close menu when a link or language button is clicked
        navLinks.addEventListener('click', (e) => {
            // If the search is for a link or a language selection button
            const isLink = e.target.closest('a');
            const isLangBtn = e.target.closest('.lang-menu button');

            if (isLink || isLangBtn) {
                navLinks.classList.remove('mobile-open');
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
        if (!response.ok) throw new Error('Network response was not ok');
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
        videoGrid.innerHTML = '<p>Check out our channel on YouTube!</p>';
    }
}

/**
 * Fetch GitHub Repos (Direct API)
 */
async function fetchGitHubRepos(username, reposToShow) {
    const repoGrid = document.getElementById('repo-grid');
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
        repoGrid.innerHTML = '<p>Check out our GitHub profile!</p>';
    }
}

/**
 * Language & Translation System
 */
let typewriterInstance = null;

function initLanguage() {
    let lang = 'en';
    try {
        const savedLang = localStorage.getItem('RobaLinkLang');
        if (savedLang) lang = savedLang;
    } catch (e) {
        // localStorage not available
    }

    if (!lang || lang === 'en') {
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('nl')) lang = 'nl';
        else if (browserLang.startsWith('de')) lang = 'de';
    }

    applyTranslations(lang);
    setupLanguageSwitcher();
}

/**
 * Applies translations to the entire page
 * @param {string} lang - The language code (en, nl, de)
 */
function applyTranslations(lang) {
    if (typeof uiTranslations === 'undefined') {
        document.body.classList.remove('lang-loading');
        return;
    }

    // 1. Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (uiTranslations[key] && uiTranslations[key][lang]) {
            el.innerHTML = uiTranslations[key][lang];
        }
    });

    // 2. Update Alt Text
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        const key = el.getAttribute('data-i18n-alt');
        if (uiTranslations[key] && uiTranslations[key][lang]) {
            el.alt = uiTranslations[key][lang];
        }
    });

    // 3. Update Page Title, Meta Description, and HTML Lang
    document.documentElement.lang = lang;
    if (uiTranslations['page_title'] && uiTranslations['page_title'][lang]) {
        document.title = uiTranslations['page_title'][lang];
    }
    if (uiTranslations['meta_description'] && uiTranslations['meta_description'][lang]) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = uiTranslations['meta_description'][lang];
    }

    // 4. Update Typewriter (Re-initialize with new text)
    if (typeof CodeTypewriter !== 'undefined' && uiTranslations['typewriter_code']) {
        const codeText = uiTranslations['typewriter_code'][lang];
        if (typewriterInstance) {
            typewriterInstance.updateCode(codeText);
        } else {
            // First time init
            const twElement = document.getElementById('typewriter-code');
            if (twElement) {
                typewriterInstance = new CodeTypewriter('typewriter-code', codeText);
            }
        }
    }

    // 5. Update current flag in switcher
    const flagIds = {
        'en': '#flag-us',
        'nl': '#flag-nl',
        'de': '#flag-de'
    };
    const currentFlagUse = document.querySelector('.lang-toggle .flag-icon use');
    if (currentFlagUse && flagIds[lang]) {
        currentFlagUse.setAttribute('href', flagIds[lang]);
    }

    // 6. Update Copyright Year (must be done after HTML injection)
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 7. Reveal body
    requestAnimationFrame(() => {
        document.body.classList.remove('lang-loading');
    });
}

function setupLanguageSwitcher() {
    const switcher = document.querySelector('.lang-switcher');
    if (!switcher) return;

    const toggle = switcher.querySelector('.lang-toggle');
    const menu = switcher.querySelector('.lang-menu');

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
    });

    menu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            try {
                localStorage.setItem('RobaLinkLang', lang);
            } catch (e) { /* Ignore */ }
            applyTranslations(lang);
            menu.classList.remove('show');
        });
    });

    document.addEventListener('click', (e) => {
        if (!switcher.contains(e.target)) {
            menu.classList.remove('show');
        }
    });
}
