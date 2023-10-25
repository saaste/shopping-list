import { initializeUI, redrawFavorites, redrawShoppingList } from "./ui.js"
import { initializeWebSocket, sendInitEvent } from "./websocket.js";

let items = [];
let idToItemMap = new Map()
let favorites = [];
let lastUpdate = 0;
let updateTimer = null;

window.onload = () => {
    if (document.getElementById("add-new-item-form")) {
        initializeUI();
        initializeWebSocket();
        updateTimer = setInterval(forceRefresh, 1000);
    }
}

const forceRefresh = () => {
    const lastUpdateDiff = Date.now() - lastUpdate;
    const maxLastUpdate = 1000 * 60 * 5;
    if (lastUpdateDiff > maxLastUpdate) {
        sendInitEvent();
    }
}

export const updateLastUpdate = () => {
    lastUpdate = Date.now();
}

export const getItems = () => {
    return items;
}

export const setItems = (newItems) => {
    items = newItems;
    idToItemMap.clear()
    items.forEach((item) => {
        idToItemMap.set(item.id, item);
    });
    redrawShoppingList(items);
    redrawFavorites(favorites);
};

export const setFavorites = (newFavorites) => {
    favorites = newFavorites;
    redrawFavorites(favorites);
}

export const getItemById = (id) => {
    return idToItemMap.get(id);
}

export const setIdToItemMap = (newMap) => {
    idToItemMap = newMap;
}

export const getFavorites = () => {
    let favs = [];

    favLoop: for (let j = 0; j < favorites.length; j++) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].name.toLowerCase() === favorites[j].toLowerCase()) {
                continue favLoop;
            }
        }
        favs.push(favorites[j]);
    }

    return favs;
}

export const itemExists = (name) => {
    for (let i = 0; i < items.length; i++) {
        if (items[i].name.toLowerCase() === name.toLowerCase()) {
            return true;
        }
    }
    return false;
}