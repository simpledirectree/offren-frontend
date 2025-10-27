// Mock data function - defined first for accessibility
function getMockDirectoryData(directorySlug) {
    const mockListings = [
        {
            id: 1,
            name: "Sample Business 1",
            location: "Local Area",
            phone: "(555) 123-4567",
            rating: 4.5,
            reviews: 23
        },
        {
            id: 2,
            name: "Sample Business 2",
            location: "Nearby",
            phone: "(555) 987-6543",
            rating: 4.2,
            reviews: 15
        },
        {
            id: 3,
            name: "Sample Business 3",
            location: "Downtown",
            phone: "(555) 456-7890",
            rating: 4.8,
            reviews: 67
        },
        {
            id: 4,
            name: "Sample Business 4",
            location: "Suburb",
            phone: "(555) 321-0987",
            rating: 4.1,
            reviews: 12
        },
        {
            id: 5,
            name: "Sample Business 5",
            location: "City Center",
    showHomepage() {
        console.log('Showing homepage');
        // Hide loading and error states
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';

        // Show homepage
        document.getElementById('homepage').style.display = 'block';
        document.getElementById('content').style.display = 'none';

        // Update page title and meta
        document.title = 'Offren Directories - Local Business Directory';
        document.getElementById('page-description').content = 'Find and compare local services in your area';
        document.getElementById('page-keywords').content = 'local services, directory, business listings';

        // Update Open Graph
        document.getElementById('og-title').content = 'Offren Directories - Local Business Directory';
        document.getElementById('og-description').content = 'Find and compare local services in your area';
        document.getElementById('og-url').content = window.location.href;

        console.log('Homepage displayed successfully');
    }
            phone: "(555) 654-3210",
            rating: 4.6,
            reviews: 34
        }
    ];

    const niceName = directorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return {
        slug: directorySlug,
        title: `${niceName} Directory`,
        description: `Find and compare the best ${directorySlug.replace(/-/g, ' ')} in your local area.`,
        listings: mockListings,
        lastUpdated: new Date().toISOString(),
        totalListings: mockListings.length,
        config: {
            niceName: niceName
        },
        meta: {
            title: `${niceName} Directory`,
            description: `Find and compare the best ${directorySlug.replace(/-/g, ' ')} in your local area.`,
            keywords: `${directorySlug}, local services, directory`
        }
    };
}

// Simple directory loader - minimal functionality
class DirectoryLoader {
    constructor() {
        this.apiBase = '/api';
        this.subdomain = this.getSubdomain();

        // Initialize on load
        this.init();
    }

    async init() {
        console.log('DirectoryLoader starting for subdomain: ' + this.subdomain);

        if (!this.subdomain) {
            // Show homepage for root path
            this.showHomepage();
            return;
        }

        await this.loadDirectory();
    }

    getSubdomain() {
        // Extract directory slug from URL path
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(p => p);

        // If we have a path like /plumbing-services, use the first part
        if (pathParts.length > 0) {
            return pathParts[0];
        }

        return null;
    }

    redirectToMainSite() {
        console.log('🔄 Redirecting to main site');
        // Only redirect if we're not already on the main site
        if (window.location.pathname !== '/') {
            window.location.href = 'https://simpledirectree.com';
        }
    }

    async loadDirectory() {
        try {
            console.log(`📡 Loading directory: ${this.subdomain}`);

            const response = await fetch(`${this.apiBase}/directory/${this.subdomain}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();

            // Check if response is HTML (API not working)
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                console.warn('❌ API returned HTML instead of JSON, using mock data');
                const mockData = getMockDirectoryData(this.subdomain);
                console.log(`✅ Using mock data: ${mockData.listings.length} listings`);
                this.renderDirectory(mockData);
                return;
            }

            // Parse JSON response
            const data = JSON.parse(responseText);

            console.log(`✅ Directory loaded: ${data.listings.length} listings`);
            this.renderDirectory(data);

        } catch (error) {
            console.warn('❌ API failed, using mock data:', error.message);
            // Use mock data as fallback
            const mockData = getMockDirectoryData(this.subdomain);
            console.log(`✅ Using mock data: ${mockData.listings.length} listings`);
            this.renderDirectory(mockData);
        }
    }

    renderDirectory(data) {
        const { listings, config, meta } = data;

        // Update page metadata
        this.updateMetadata(meta, config);

        // Update content
        this.updateHeader(config, listings.length);
        this.renderListings(listings);
        this.updateFooter(meta);

        // Show content, hide loading
        this.showContent();

        console.log('🎨 Directory rendered successfully');
    }

    updateMetadata(meta, config) {
        document.title = meta.title;
        document.getElementById('page-description').content = meta.description;
        document.getElementById('page-keywords').content = meta.keywords || '';

        // Update Open Graph
        document.getElementById('og-title').content = meta.title;
        document.getElementById('og-description').content = meta.description;
        document.getElementById('og-url').content = window.location.href;

        // Update structured data
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": meta.title,
            "description": meta.description,
            "url": window.location.href,
            "about": {
                "@type": "LocalBusiness",
                "name": config.niceName
            }
        };

        document.getElementById('structured-data').textContent = JSON.stringify(structuredData, null, 2);
    }

    updateHeader(config, listingsCount) {
        document.getElementById('directory-title').textContent = config.niceName;
        document.getElementById('directory-description').textContent =
            `Find and compare ${config.niceName.toLowerCase()} in your area`;
        document.getElementById('directory-stats').textContent =
            `📊 ${listingsCount} listings`;
    }

    updateFooter(meta) {
        if (meta.lastUpdated || meta.lastFetched) {
            const updateTime = meta.lastUpdated || meta.lastFetched;
            const date = new Date(updateTime);
            document.getElementById('footer-updated').textContent =
                `Updated ${this.formatDate(date)}`;
        }
    }

    renderListings(listings) {
        const container = document.getElementById('listings');

        if (listings.length === 0) {
            this.showNoResults();
            return;
        }

        const html = listings.map(listing => this.renderListing(listing)).join('');
        container.innerHTML = html;

        this.updateResultsCount(listings.length, listings.length);
    }

    renderListing(listing) {
        const searchData = Object.values(listing).join(' ').toLowerCase();

        return `
            <div class="listing" data-search="${this.escapeHtml(searchData)}">
                <div class="listing-header">
                    <h3 class="listing-name">${this.escapeHtml(listing.name || 'Unknown Business')}</h3>
                    ${listing.rating ? `<div class="listing-rating">⭐ ${listing.rating}</div>` : ''}
                </div>

                <div class="listing-meta">
                    ${listing.location ? `<div class="meta-item"><span class="icon">📍</span> ${this.escapeHtml(listing.location)}</div>` : ''}
                    ${listing.phone ? `<div class="meta-item"><span class="icon">📞</span> <a href="tel:${listing.phone}">${this.escapeHtml(listing.phone)}</a></div>` : ''}
                    ${listing.price_range ? `<div class="meta-item"><span class="icon">💰</span> ${this.escapeHtml(listing.price_range)}</div>` : ''}
                    ${listing.availability ? `<div class="meta-item"><span class="icon">🕒</span> ${this.escapeHtml(listing.availability)}</div>` : ''}
                </div>

                ${this.renderServices(listing.services)}

                <div class="listing-actions">
                    ${listing.website ? `<a href="${this.escapeHtml(listing.website)}" class="btn btn-primary" target="_blank" rel="noopener">Visit Website</a>` : ''}
                    ${listing.phone ? `<a href="tel:${listing.phone}" class="btn btn-secondary">Call Now</a>` : ''}
                </div>
            </div>
        `;
    }

    renderServices(services) {
        if (!services || !Array.isArray(services) || services.length === 0) {
            return '';
        }

        const serviceTags = services.map(service =>
            `<span class="service-tag">${this.escapeHtml(service)}</span>`
        ).join('');

        return `<div class="services">${serviceTags}</div>`;
    }

    showContent() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    }

    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'none';
        document.getElementById('error').style.display = 'block';
    }

    showNoResults() {
        document.getElementById('listings').innerHTML = '';
        document.getElementById('no-results').style.display = 'block';
    }

    updateResultsCount(showing, total) {
        const resultsCount = document.getElementById('results-count');
        if (showing === total) {
            resultsCount.textContent = `Showing all ${total} listings`;
        } else {
            resultsCount.textContent = `Showing ${showing} of ${total} listings`;
        }
    }

    formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Search and filtering functionality
function filterListings() {
    const searchTerm = document.getElementById('search').value.toLowerCase().trim();
    const listings = document.querySelectorAll('.listing');
    let visibleCount = 0;

    listings.forEach(listing => {
        const searchData = listing.dataset.search;
        const isVisible = !searchTerm || searchData.includes(searchTerm);

        listing.style.display = isVisible ? 'block' : 'none';
        if (isVisible) visibleCount++;
    });

    // Update results count
    const totalCount = listings.length;
    const loader = window.directoryLoader;
    if (loader) {
        loader.updateResultsCount(visibleCount, totalCount);
    }

    // Show/hide no results message
    if (visibleCount === 0 && searchTerm) {
        document.getElementById('no-results').style.display = 'block';
        document.getElementById('listings').style.opacity = '0.5';
    } else {
        document.getElementById('no-results').style.display = 'none';
        document.getElementById('listings').style.opacity = '1';
    }
}

// Enhanced search with debouncing
let searchTimeout;
function debouncedFilter() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterListings, 300);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Offren Directory Loader starting...');
    window.directoryLoader = new DirectoryLoader();

    // Add enhanced search listener
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', debouncedFilter);
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
});

// Handle network status
window.addEventListener('online', () => {
    console.log('🌐 Connection restored');
});

window.addEventListener('offline', () => {
    console.log('📴 Connection lost');
});

