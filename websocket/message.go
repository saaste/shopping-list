package websocket

import (
	"encoding/json"
	"fmt"

	"github.com/saaste/shopping-list/shopping_list"
)

type MessageType string

const (
	MessageTypeUnknown        MessageType = "UNKNOWN"
	MessageTypeInitial        MessageType = "INITIAL"
	MessageTypeAddItem        MessageType = "ADD_ITEM"
	MessageTypeRemoveItem     MessageType = "REMOVE_ITEM"
	MessageTypeSetItemStatus  MessageType = "SET_ITEM_STATUS"
	MessageTypeSortItems      MessageType = "SORT_ITEMS"
	MessageTypeRemoveFavorite MessageType = "REMOVE_FAVORITE"
)

var messageTypes = map[string]MessageType{
	"UNKNOWN":         MessageTypeUnknown,
	"INITIAL":         MessageTypeInitial,
	"ADD_ITEM":        MessageTypeAddItem,
	"REMOVE_ITEM":     MessageTypeRemoveItem,
	"SET_ITEM_STATUS": MessageTypeSetItemStatus,
	"SORT_ITEMS":      MessageTypeSortItems,
	"REMOVE_FAVORITE": MessageTypeRemoveFavorite,
}

type Message struct {
	Type MessageType `json:"type"`
}

type MessageAddItem struct {
	Message
	ItemName string `json:"name"`
}

type MessageRemoveItem struct {
	Message
	ID string `json:"id"`
}

type MessageSetItemStatus struct {
	Message
	ID      string `json:"id"`
	Checked bool   `json:"checked"`
}

type MessageSortItems struct {
	Message
	Items []shopping_list.Item `json:"items"`
}

type MessageRemoveFavorite struct {
	Message
	Name string `json:"name"`
}

func GetMessageType(byt []byte) (MessageType, error) {
	var message Message
	err := json.Unmarshal(byt, &message)
	if err != nil {
		return MessageTypeUnknown, fmt.Errorf("failed to parse JSON message: %w", err)
	}

	messageType, ok := messageTypes[string(message.Type)]
	if ok {
		return messageType, nil
	}

	return MessageTypeUnknown, nil
}

func ParseMessageAddItem(byt []byte) (*MessageAddItem, error) {
	var message MessageAddItem
	err := json.Unmarshal(byt, &message)
	if err != nil {
		return nil, fmt.Errorf("failed to parse JSON message: %w", err)
	}

	return &message, nil
}

func ParseMessageRemoveItem(byt []byte) (*MessageRemoveItem, error) {
	var message MessageRemoveItem
	err := json.Unmarshal(byt, &message)
	if err != nil {
		return nil, fmt.Errorf("failed to parse JSON message: %w", err)
	}

	return &message, nil
}

func ParseMessageSetItemStatus(byt []byte) (*MessageSetItemStatus, error) {
	var message MessageSetItemStatus
	err := json.Unmarshal(byt, &message)
	if err != nil {
		return nil, fmt.Errorf("failed to parse JSON message: %w", err)
	}

	return &message, nil
}

func ParseMessageSortItems(byt []byte) (*MessageSortItems, error) {
	var message MessageSortItems
	err := json.Unmarshal(byt, &message)
	if err != nil {
		return nil, fmt.Errorf("failed to parse JSON message: %w", err)
	}

	return &message, nil
}

func ParseMessageRemoveFavorite(byt []byte) (*MessageRemoveFavorite, error) {
	var message MessageRemoveFavorite
	err := json.Unmarshal(byt, &message)
	if err != nil {
		return nil, fmt.Errorf("failed to parse JSON message: %w", err)
	}

	return &message, nil
}
