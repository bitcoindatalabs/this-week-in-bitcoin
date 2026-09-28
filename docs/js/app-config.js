document.addEventListener('DOMContentLoaded', () => {
    if (typeof BitcoinLabsApp !== 'undefined') {
        BitcoinLabsApp.init({
            isApp: true,
            appName: 'TWIB',
            appHomeUrl: 'index.html',

            suiteLinks: [
                { name: 'orange-dev-tracker', url: 'https://orange-dev.bitcoindatalabs.org', icon: 'fas fa-chart-line' },
                { name: 'orange-dev-network', url: 'https://network.bitcoindatalabs.org', icon: 'fas fa-project-diagram' }
            ]
        });

        // Force the body to have the 'has-nav' class. 
        // This ensures the BDL app-components render the mobile hamburger menu 
        // to cleanly house the suite links on small screens, instead of dumping them inline.
        document.body.classList.add('has-nav');
    }
});
