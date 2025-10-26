// assets/directory-loader.js
class DirectoryLoader {
    constructor() {
        this.apiBase = '/api';
        this.subdomain = this.getSubdomain();
        this.listings = [];
        this.filteredListings = [];

        // Initialize on load
        this.init();
    }
    
    async init() {
        console.log(`🚀 DirectoryLoader starting for subdomain: ${this.subdomain}`);
        
        if (!this.subdomain || this.isMainDomain()) {
            this.redirectToMainSite();
            return;
        }
        
        await this.loadDirectory();
    }
    
    getSubdomain() {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        // Handle different scenarios
        if (parts.length >= 3) {
            return parts[0]; // subdomain.offren.org
        } else if (parts.length === 2 && hostname !== 'offren.org') {
            return parts[0]; // subdomain.org (for testing)
        }
        
        return null;
    }
    
    isMainDomain() {
        return ['www', 'offren', 'app'].includes(this.subdomain);
    }
    
    redirectToMainSite() {
        console.log('🔄 Redirecting to main site');
        window.location.href = 'https://offren.org';
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
            
            const data = await response.json();
            
            console.log(`✅ Directory loaded: ${data.listings.length} listings`);
            this.renderDirectory(data);
            
        } catch (error) {
            console.error('❌ Failed to load directory:', error);
            this.showError(error.message);
        }
    }
    
    renderDirectory(data) {
        const { listings, config, meta } = data;
        
        this.listings = listings;
        this.filteredListings = [...listings];
        
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
        // Update title and meta tags
        document.title = meta.title;
        document.getElementById('page-title').textContent = meta.title;
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
    
    hideNoResults() {
        document.getElementById('no-results').style.display = 'none';
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
