
import { setItems, setFavorites } from "./app.js";

let socket;

export const initializeWebSocket = () => {
    let protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    socket = new WebSocket(protocol + window.location.host + "/ws")

    socket.addEventListener("open", (event) => {
        socket.send(JSON.stringify({"type": "INITIAL"}));
    });
    
    socket.addEventListener("message", (event) => {
        handleWsMessage(event.data);
    });
};

export const sendAddItemEvent = (itemName) => {
    socket.send(JSON.stringify({"type": "ADD_ITEM", "name": itemName}));
}

export const sendSetItemStatusEvent = (itemId, checked) => {
    socket.send(JSON.stringify({"type": "SET_ITEM_STATUS", "id": itemId, checked}));
}

export const sendRemoveItemEvent = (itemId) => {
    socket.send(JSON.stringify({"type": "REMOVE_ITEM", "id": itemId}));
}

export const sendSortItemsEvent = (sortedItems) => {
    socket.send(JSON.stringify({ "type": "SORT_ITEMS", "items": sortedItems }));
}

export const sendRemoveFavoriteEvent = (itemName) => {
    socket.send(JSON.stringify({ "type": "REMOVE_FAVORITE", "name": itemName }));
}

const handleWsMessage = (wsMessage) => {
    const message = JSON.parse(wsMessage)
    if (message.type == "LIST_UPDATED") {
        const items = message.body.items;
        setItems(items);
    }
    if (message.type == "FAVORITES_UPDATED") {
        setFavorites(message.body);
    }
}