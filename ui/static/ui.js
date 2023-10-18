import { getFavorites } from "./app.js";
import { initializeDragSort } from "./dragsort.js";
import { sendAddItemEvent, sendSetItemStatusEvent, sendRemoveItemEvent } from "./websocket.js";

let autoCompleteEl;

export const initializeUI = () => {
    const addInputEl = document.getElementById("new-item-name");
    const addItemButton = document.getElementById("add-item-button");
    
    autoCompleteEl = document.getElementById("auto-complete");

    addInputEl.addEventListener("focus", () => {
        console.log("focus");
        redrawFavorites();
        autoCompleteEl.classList.remove("hide");
    });

    addInputEl.addEventListener("blur", () => {
        console.log("lost focus");
        setTimeout(() => {
            autoCompleteEl.classList.add("hide");
        }, 200);
    });

    addInputEl.addEventListener("keyup", () => {
        redrawFavorites();
    });

    addItemButton.addEventListener("click", () => {
        handleAddNewItem();
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

    const favorites = getFavorites();
    console.log("Favorites", favorites)
    favorites.forEach((fav) => {
        if (fav.toLowerCase().startsWith(searchQuery)) {
            const li = document.createElement("li");
            li.addEventListener("click", handleFavoriteClick);
            li.innerText = fav;

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
    
    let a = document.createElement("a")
    a.setAttribute("href", "#");
    a.addEventListener("click", () => {
        handleRemoveItem(item.id);
        return false;
    });

    const trashImg = document.createElement("img");
    trashImg.setAttribute("src", "/static/bin.png");
    trashImg.setAttribute("alt", "Remove")
    trashImg.classList.add("delete");
    a.appendChild(trashImg);

    let li = document.createElement("li");
    li.setAttribute("draggable", "true")
    li.setAttribute("data-item-id", item.id);
    li.classList.add("item");
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
    li.appendChild(a);

    return li;
};

const handleFavoriteClick = (e) => {
    const value = e.target.innerText;

    const addInputEl = document.getElementById("new-item-name");
    addInputEl.value = value;

    handleAddNewItem(value);
}

const handleToggleCheckbox = (itemId, checked) => {
    sendSetItemStatusEvent(itemId, checked);
}

let handleRemoveItem = (itemId) => {
    sendRemoveItemEvent(itemId);
}

