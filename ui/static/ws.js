let items = [];
let idToItemMap = new Map()

let socket;

const createListItem = (item) => {
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

    trashImg = document.createElement("img");
    trashImg.setAttribute("src", "/static/bin.png");
    trashImg.setAttribute("alt", "Remove")
    trashImg.classList.add("delete");
    a.appendChild(trashImg);
    // a.appendChild(document.createTextNode("X"));

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

    label = document.createElement("span")
    label.innerHTML = item.name

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(a);

    return li;
};

const redrawShoppingList = () => {
    sortableList.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
        sortableList.appendChild(createListItem(items[i]));
    }
    
    lastItem = document.createElement("li");
    lastItem.classList.add("item");
    sortableList.appendChild(lastItem);

    initializeDragSort();
};

const handleWsMessage = (wsMessage) => {
    console.log("Received", wsMessage)
    const message = JSON.parse(wsMessage)
    if (message.type == "LIST_UPDATED") {
        items = message.body.items;
        idToItemMap.clear()
        items.forEach((item) => {
            idToItemMap.set(item.id, item);
        });
        redrawShoppingList();
    }
    if (message.type == "FAVORITES_UPDATED") {
        favorites = message.body;
        redrawFavorites();
    }
}

const handleAddNewItem = () => {
    const input = document.getElementById("new-item-name");
    const itemName = input.value;

    if (itemName != "") {
        socket.send(JSON.stringify({"type": "ADD_ITEM", "name": itemName}));
        input.value = "";
    }   
}

let handleRemoveItem = (itemId) => {
    socket.send(JSON.stringify({"type": "REMOVE_ITEM", "id": itemId}));
}

let handleToggleCheckbox = (itemId, checked) => {
    socket.send(JSON.stringify({"type": "SET_ITEM_STATUS", "id": itemId, checked}));
}

window.addEventListener("load", (event) => {
    console.log("HOST", window.location.host)
    let protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    socket = new WebSocket(protocol + window.location.host + "/ws")

    socket.addEventListener("open", (event) => {
        socket.send(JSON.stringify({"type": "INITIAL"}));
    });
    
    socket.addEventListener("message", (event) => {
        console.log("Message from server: ", event.data);
        handleWsMessage(event.data);
    });
});