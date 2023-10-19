import { getFavorites } from "./app.js";
import { initializeDragSort } from "./dragsort.js";
import { sendAddItemEvent, sendSetItemStatusEvent, sendRemoveItemEvent, sendRemoveFavoriteEvent } from "./websocket.js";

let autoCompleteEl;

export const initializeUI = () => {
    const addItemContainer = document.getElementById("add-new-item-form");
    const addInputEl = document.getElementById("new-item-name");
    const addItemButton = document.getElementById("add-item-button");

    autoCompleteEl = document.getElementById("auto-complete");

    document.body.addEventListener("click", (e) => {
        if (e.target === document.body) {
            hideFavorites();
        }
    });

    addItemContainer.addEventListener("focusin", () => {
        showFavorites();
    });

    addInputEl.addEventListener("keyup", (e) => {
        console.log(e.code);
        switch (e.code) {
            case "Escape":
                hideFavorites();
                break;
            default:
                showFavorites();
                redrawFavorites();
                break;
        }
    });

    addItemButton.addEventListener("click", () => {
        handleAddNewItem();
        hideFavorites();
    })
}

const handleAddNewItem = () => {
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
    console.log("Favorites", favorites)
    favorites.forEach((fav) => {
        if (fav.toLowerCase().startsWith(searchQuery)) {
            const li = document.createElement("li");


            const label = document.createElement("span")
            label.innerText = fav;
            label.addEventListener("click", handleFavoriteClick);
            li.appendChild(label)

            const trashImg = document.createElement("img");
            trashImg.setAttribute("src", "/static/trash-can-white.png");
            trashImg.setAttribute("alt", "Remove")
            trashImg.classList.add("delete");
            trashImg.addEventListener("click", handleFavoriteDeleteClick)
            li.appendChild(trashImg)

            // const deleteButton = document.createElement("span")
            // deleteButton.innerText = "[X]"
            // deleteButton.addEventListener("click", handleFavoriteDeleteClick);
            // li.appendChild(deleteButton)

            favoritesEl.appendChild(li);
        }
    });
}

export const redrawShoppingList = (items) => {
    const sortableList = document.getElementById("sortable-list");
    sortableList.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
        sortableList.appendChild(createListItem(items[i]));
    }

    const lastItem = document.createElement("li");
    lastItem.classList.add("item");
    sortableList.appendChild(lastItem);

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
    trashImg.classList.add("delete-item");
    trashImg.addEventListener("click", () => {
        handleRemoveItem(item.id);
    });


    // const trashImg = document.createElement("img");
    // trashImg.setAttribute("src", "/static/trash-can-white.png");
    // trashImg.setAttribute("alt", "Remove")
    // trashImg.classList.add("delete");
    // trashImg.addEventListener("click", () => {
    //     handleRemoveItem(item.id);
    // });

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

    const addInputEl = document.getElementById("new-item-name");
    addInputEl.value = value;

    handleAddNewItem(value);
    hideFavorites();
}

const handleFavoriteDeleteClick = (e) => {
    console.log("Deleting favorite");
    const itemName = e.target.previousSibling.innerText;
    sendRemoveFavoriteEvent(itemName);

    const addInputEl = document.getElementById("new-item-name");
    addInputEl.focus();
}

const showFavorites = () => {
    autoCompleteEl = document.getElementById("auto-complete");
    autoCompleteEl.classList.remove("hide");
}

const hideFavorites = () => {
    autoCompleteEl = document.getElementById("auto-complete");
    autoCompleteEl.classList.add("hide");
}