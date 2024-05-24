const STORAGE_KEY = "gh-custom-filters"

const createGithubFilter = (name, queryString) => {
    const uriEncodedQueryString = encodeURIComponent(queryString);
    return `<a class="js-selected-navigation-item subnav-item flex-1 text-center no-wrap hide-sm"
       title="Pull requests requesting your review" 
       data-turbo-frame="_self"
       data-selected-links="dashboard_review_requested /pulls?q=${uriEncodedQueryString}"
       href="/pulls?q=${uriEncodedQueryString}">${name}
    </a>`
}

function fromHTML(html, trim = true) {
    // Process the HTML string.
    html = trim ? html.trim() : html;
    if (!html) return null;

    // Then set up a new template element.
    const template = document.createElement('template');
    template.innerHTML = html;
    const result = template.content.children;

    // Then return either an HTMLElement or HTMLCollection,
    // based on whether the input HTML had one or more roots.
    if (result.length === 1) return result[0];
    return result;
}


const mo = new MutationObserver(onMutation);
observe();


async function onMutation() {
    if (document.querySelector("nav.subnav-links")) {
        mo.disconnect();
        await refreshFilters();
        observe();
    }
}

function observe() {
    mo.observe(document, {
        subtree: true,
        childList: true,
    });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.message === "filters-changed") {
        await refreshFilters();
    }
});

async function refreshFilters() {
    const filters = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY]?.filters ?? [];
    const filterLinks = document.querySelector("nav.subnav-links");
    if (filterLinks !== null && filters.length !== 0) {
        while (filterLinks.firstChild) {
            filterLinks.removeChild(filterLinks.lastChild);
        }
        for (const {name, ghQueryString} of filters) {
            const filter = createGithubFilter(name, ghQueryString)
            filterLinks.appendChild(fromHTML(filter))
        }
    }
}

