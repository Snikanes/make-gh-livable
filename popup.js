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

const updateFilterList = (filters) => {
    const filtersList = document.getElementById("gh-filters-list")
    while (filtersList.firstChild) {
        filtersList.removeChild(filtersList.lastChild);
    }
    // TODO: Add delete button for each filter
    for (const filter of filters) {
        filtersList.appendChild(fromHTML(
            `
            <li>
                <p>${filter.name}</p>
                <pre>${filter.ghQueryString}</pre>
            </li>`
            )
        );
    }
}

const createNewFilter = async () => {
    const name = document.getElementById("filter-name").value;
    const ghQueryString = document.getElementById("filter-query").value;

    const result = await chrome.storage.local.get(STORAGE_KEY);
    console.log("filters before update: ", JSON.stringify(result))
    console.log(JSON.stringify(result));

    let existingFilters = result[STORAGE_KEY]?.filters ?? []
    const updatedFilters = {
        filters: [
            ...existingFilters,
            {
                name,
                ghQueryString
            }
        ]
    }
    await chrome.storage.local.set({
        [STORAGE_KEY]: updatedFilters
    });
    const filtersAfterUpdate = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY]?.filters ?? [];
    updateFilterList(filtersAfterUpdate);
}

(async () => {
    const filters = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY]?.filters ?? [];
    updateFilterList(filters);
    // TODO: Run replacement of filters to avoid having to reload page
})();

document.getElementById("new-filter-button").addEventListener("click", createNewFilter);