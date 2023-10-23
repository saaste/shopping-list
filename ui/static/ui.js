import { getItems, getFavorites } from "./app.js";
import { initializeDragSort } from "./dragsort.js";
import { sendAddItemEvent, sendSetItemStatusEvent, sendRemoveItemEvent, sendRemoveFavoriteEvent, sendSortItemsEvent } from "./websocket.js";

let addInputEl;
let autoCompleteEl;
let favoritesEl;
let selectedFavoriteIndex = -1;

export const initializeUI = () => {
    const addItemContainer = document.getElementById("add-new-item-form");
    const addItemButton = document.getElementById("add-item-button");
    const uncheckAllButton = document.getElementById("uncheck-all")
    const deleteAllButton = document.getElementById("delete-all");

    addInputEl = document.getElementById("new-item-name");
    autoCompleteEl = document.getElementById("auto-complete");
    favoritesEl = document.getElementById("favorites");

    document.body.addEventListener("click", (e) => {
        if (e.target === document.body) {
            hideFavorites();
        }
    });

    addItemContainer.addEventListener("focusin", () => {
        showFavorites();
    });

    addInputEl.addEventListener("keyup", (e) => {
        switch (e.code) {
            case "Escape":
                hideFavorites();
                break;
            case "Enter":
                handleFavoriteEnter();
                break;
            case "ArrowDown":
                selectNextFavorite();
                break;
            case "ArrowUp":
                selectPreviousFavorite();
                break;
            default:
                redrawFavorites();
                break;
        }
    });

    addItemButton.addEventListener("click", () => {
        handleAddNewItem();
    });

    uncheckAllButton.addEventListener("click", () => {
        const items = getItems();
        items.forEach((item) => {
            item.checked = false;
        });
        sendSortItemsEvent(items);
    });

    deleteAllButton.addEventListener("click", () => {
        sendSortItemsEvent([]);
    });
}

const handleAddNewItem = () => {
    hideFavorites();

    const input = document.getElementById("new-item-name");
    const itemName = input.value;

    if (itemName != "") {
        sendAddItemEvent(itemName);
        input.value = "";
    }
}

export const redrawFavorites = () => {
    const searchQuery = document.getElementById("new-item-name").value.toLowerCase();
    const favoritesEl = document.getElementById("favorites");
    favoritesEl.innerHTML = "";

    const favorites = getFavorites().slice(0, 10);
    favorites.forEach((fav) => {
        if (fav.toLowerCase().startsWith(searchQuery)) {
            const li = document.createElement("li");
            li.addEventListener("mouseenter", () => {
                resetSelectedFavorite();
            });


            const label = document.createElement("span")
            label.innerText = fav;
            label.addEventListener("click", handleFavoriteClick);
            li.appendChild(label)

            const trashImg = document.createElement("div");
            trashImg.setAttribute("alt", "Remove");
            trashImg.setAttribute("title", "Remove");
            trashImg.classList.add("delete-favorite");
            trashImg.addEventListener("click", handleFavoriteDeleteClick);

            li.appendChild(trashImg)

            favoritesEl.appendChild(li);
        }
    });

    resetSelectedFavorite();
    if (document.activeElement === addInputEl) {
        showFavorites();
    }
}

export const redrawShoppingList = (items) => {
    const sortableList = document.getElementById("sortable-list");
    sortableList.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
        sortableList.appendChild(createListItem(items[i]));
    }

    initializeDragSort();
};

export const createListItem = (item) => {
    let checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.addEventListener("click", () => {
        handleToggleCheckbox(item.id, !item.checked);
    })
    if (item.checked) {
        checkbox.setAttribute("checked", "checked");
    }

    const trashImg = document.createElement("div");
    trashImg.setAttribute("alt", "Remove");
    trashImg.setAttribute("title", "Remove");
    trashImg.classList.add("delete-item");
    trashImg.addEventListener("click", () => {
        handleRemoveItem(item.id);
    });

    const dragHandle = document.createElement("div");
    dragHandle.classList.add("drag-handle");

    let li = document.createElement("li");
    li.setAttribute("draggable", "true")
    li.setAttribute("data-item-id", item.id);
    li.classList.add("item");
    li.addEventListener("click", () => {
        hideFavorites();
    });
    li.addEventListener("dragstart", () => {
        setTimeout(() => li.classList.add("dragging"), 0);
    });
    li.addEventListener("touchstart", () => {
        setTimeout(() => li.classList.add("dragging"), 0);
    })
    li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
    })
    li.addEventListener("touchend", () => {
        li.classList.remove("dragging");
    })

    const label = document.createElement("span")
    label.innerHTML = item.name

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(trashImg);
    li.appendChild(dragHandle);

    return li;
};

const handleToggleCheckbox = (itemId, checked) => {
    sendSetItemStatusEvent(itemId, checked);
}

const handleRemoveItem = (itemId) => {
    sendRemoveItemEvent(itemId);
}

const handleFavoriteClick = (e) => {
    const value = e.target.innerText;
    addInputEl.value = value;

    handleAddNewItem(value);
    hideFavorites();
}

const handleFavoriteDeleteClick = (e) => {
    const itemName = e.target.previousSibling.innerText;
    sendRemoveFavoriteEvent(itemName);

    addInputEl.focus();
}

const handleFavoriteEnter = () => {
    if (selectedFavoriteIndex > -1) {
        let selectedFavorite = favoritesEl.childNodes[selectedFavoriteIndex].childNodes[0].innerText;
        addInputEl.value = selectedFavorite
    }
    handleAddNewItem();
    resetSelectedFavorite();
}

const showFavorites = () => {
    autoCompleteEl = document.getElementById("auto-complete");
    if (favoritesEl.childElementCount > 0) {
        autoCompleteEl.classList.remove("hide");
    } else {
        autoCompleteEl.classList.add("hide");
    }
}

const hideFavorites = () => {
    autoCompleteEl = document.getElementById("auto-complete");
    autoCompleteEl.classList.add("hide");
}

const selectNextFavorite = () => {
    let favorites = favoritesEl.childNodes
    if (favorites.length === 0) {
        selectedFavoriteIndex = -1;
        return;
    }

    if (selectedFavoriteIndex === -1) {
        selectedFavoriteIndex = 0;
    } else if (selectedFavoriteIndex < favorites.length - 1) {
        selectedFavoriteIndex += 1;
    }

    let selected = favoritesEl.querySelectorAll(".selected");
    selected.forEach((el) => el.classList.remove("selected"));

    favorites[selectedFavoriteIndex].classList.add("selected");
}

const selectPreviousFavorite = () => {
    let favorites = favoritesEl.childNodes
    if (favorites.length === 0 || selectedFavoriteIndex < 0) {
        selectedFavoriteIndex = -1;
        return;
    }

    let selected = favoritesEl.querySelectorAll(".selected");
    selected.forEach((el) => el.classList.remove("selected"));

    if (selectedFavoriteIndex === 0) {
        selectedFavoriteIndex = -1;
    } else {
        selectedFavoriteIndex -= 1;
        favorites[selectedFavoriteIndex].classList.add("selected");
    }
}

const resetSelectedFavorite = () => {
    let selected = favoritesEl.querySelectorAll(".selected");
    selected.forEach((el) => el.classList.remove("selected"));
    selectedFavoriteIndex = -1;
}