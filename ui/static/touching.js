var listElements;
var targetEl;
var wrapper;
var itemClip;
var scopeObj;

const initializeDragSort = () => {
    listElements = document.querySelectorAll(".sortable-list .item");
    wrapper = document.getElementById("sortable-list");
    itemClip = document.getElementById("item-clip");

    listElements.forEach((element) => {
        element.addEventListener("dragstart", handleDragStart);
        element.addEventListener("dragend", handleDragEnd);
        element.addEventListener("dragenter", handleDragEnter);

        element.addEventListener("touchstart", handleTouchStart);
        element.addEventListener("touchend", handleTouchEnd);
        element.addEventListener("touchmove", handleTouchMove);
    });
};

const handleDragStart = (event) => {
    console.log("drag-start");
    targetEl = event.target;
    targetEl.classList.add("on-drag");
};

const handleDragEnd = (event) => {
    console.log("drag-end");
    targetEl.classList.remove("on-drag");
    sendSortedEvent();
};

const handleDragEnter = (event) => {
    console.log("drag-enter");
    if (event.target.tagName === "LI") {
        console.log(targetEl, event.target);
        wrapper.insertBefore(targetEl, event.target);
    }
};

const handleTouchStart = (event) => {
    console.log("touch-start");
    defineScope(listElements);
    targetEl = getTouchEventLiElement(event.target);
    itemClip.style.top = event.changedTouches[0].clientY + "px";
    itemClip.style.left = event.changedTouches[0].clientX + "px";
    itemClip.innerText = event.target.innerText;
    itemClip.classList.remove("hide");
    targetEl.classList.add("on-drag");

};

const handleTouchEnd = (event) => {
    console.log("touch-end");
    itemClip.classList.add("hide");
    targetEl.classList.remove("on-drag");
    sendSortedEvent();
};

const handleTouchMove = (event) => {
    event.preventDefault();
    console.log("touch-move");
    itemClip.style.top = event.changedTouches[0].clientY + "px";
    itemClip.style.left = event.changedTouches[0].clientX + "px";
    
    hitTest(event.changedTouches[0].clientX, event.changedTouches[0].clientY)
}

const getTouchEventLiElement = (eventTarget) => {
    if (eventTarget.tagName === "LI") {
        return eventTarget;
    }
    if (eventTarget.tagName === "BODY") {
        return undefined;
    }

    return getTouchEventLiElement(eventTarget.parentNode);
}

const hitTest = (thisX, thisY) => {
    for (let i = 0, max = scopeObj.length; i < max; i++) {
        if (thisX > scopeObj[i].startX && thisX < scopeObj[i].endX) {
            if (thisY > scopeObj[i].startY && thisY < scopeObj[i].endY) {
                wrapper.insertBefore(targetEl, scopeObj[i].target);
                return;
            }
        }
    }
};

const defineScope = (elementArray) => {
    scopeObj = [];
    for (let i = 0, max = elementArray.length; i < max; i++) {
        let newObj = {};
        newObj.target = elementArray[i];
        newObj.startX = elementArray[i].offsetLeft;
        newObj.endX = elementArray[i].offsetLeft + elementArray[i].offsetWidth;
        newObj.startY = elementArray[i].offsetTop;
        newObj.endY = elementArray[i].offsetTop + elementArray[i].offsetHeight;
        scopeObj.push(newObj);
    }
};

const sendSortedEvent = () => {
    const sortedItemList = []
    for (let i = 0; i < sortableList.childElementCount; i++) {
        const el = sortableList.children.item(i);
        if (el.getAttribute("draggable") === "true") {
            const itemId = el.getAttribute("data-item-id");
            const item = idToItemMap.get(itemId);
            sortedItemList.push(item)
        }
    }
    socket.send(JSON.stringify({ "type": "SORT_ITEMS", "items": sortedItemList }));
}