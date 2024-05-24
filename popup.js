const STORAGE_KEY = "gh-custom-filters"

const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

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
        const deleteButtonId = `delete-${filter.id}`;
        filtersList.appendChild(fromHTML(
                `
            <li>
                <p>${filter.name}</p>
                <pre>${filter.ghQueryString}</pre>
                <button id="${deleteButtonId}">Slett</button>
            </li>`
            )
        );
        document.getElementById(deleteButtonId).addEventListener("click", () => deleteFilter(filter.id));
    }
}

const notifyContentScriptAboutFilterUpdate = async () => {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    await chrome.tabs.sendMessage(tab.id, {message: "filters-changed"});
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

const deleteFilter = async (filterId) => {
    const currentFilters = await getCurrentFilters();
    const newFilters = {
        filters: currentFilters.filter((filter) => filter.id !== filterId),
    }
    await updateFilters(newFilters);
    await notifyContentScriptAboutFilterUpdate();
}

const createNewFilter = async () => {
    const nameInput = document.getElementById("filter-name");
    const queryStringInput = document.getElementById("filter-query");

    const filters = await getCurrentFilters();
    const newFilters = {
        filters: [
            ...filters,
            {
                id: generateUniqueId(),
                name: nameInput.value,
                ghQueryString: queryStringInput.value
            }
        ]
    }
    await updateFilters(newFilters);
    await notifyContentScriptAboutFilterUpdate();

    nameInput.value = '';
    queryStringInput.value = '';
}

(async () => {
    const filters = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY]?.filters ?? [];
    updatePopupFilterList(filters);
})();

document.getElementById("new-filter-button").addEventListener("click", createNewFilter);