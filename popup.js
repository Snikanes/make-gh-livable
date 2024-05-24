const STORAGE_KEY = "gh-custom-filters"

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

const updatePopupFilterList = (filters) => {
    const filtersList = document.getElementById("gh-filters-list")
    while (filtersList.firstChild) {
        filtersList.removeChild(filtersList.lastChild);
    }
    for (const filter of filters) {
        const deleteButtonId = `delete-${filter.name}`;
        filtersList.appendChild(fromHTML(
            `
            <li>
                <p>${filter.name}</p>
                <pre>${filter.ghQueryString}</pre>
                <button id="${deleteButtonId}">Slett</button>
            </li>`
            )
        );
        document.getElementById(deleteButtonId).addEventListener("click", () => deleteFilter(filter.name));
    }
}

const getCurrentFilters = async () => {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY]?.filters ?? [];
}

const updateFilters = async (newFilters) => {
    await chrome.storage.local.set({
        [STORAGE_KEY]: newFilters
    });
    const filtersAfterUpdate = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY]?.filters ?? [];
    updatePopupFilterList(filtersAfterUpdate);
}

const deleteFilter = async (filterName) => {
    const currentFilters = await getCurrentFilters();
    const newFilters = {
        filters: currentFilters.filter((filter) => filter.name !== filterName),
    }
    await updateFilters(newFilters);
}

const createNewFilter = async () => {
    const name = document.getElementById("filter-name").value;
    const ghQueryString = document.getElementById("filter-query").value;

    const filters = await getCurrentFilters();
    const newFilters = {
        filters: [
            ...filters,
            {
                name,
                ghQueryString
            }
        ]
    }
    await updateFilters(newFilters);
}

(async () => {
    const filters = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY]?.filters ?? [];
    updatePopupFilterList(filters);
    // TODO: Run replacement of filters to avoid having to reload page
})();

document.getElementById("new-filter-button").addEventListener("click", createNewFilter);