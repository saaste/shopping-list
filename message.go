package main

import (
	"encoding/json"
	"fmt"
)

type MessageType int

const (
	MessageTypeUnknown MessageType = iota
	MessageTypeAddItem
	MessageTypeRemoveItem
	MessageTypeSetItemStatus
	MessageTypeSortItems
	MessageTypeSetStatus
)

type Message struct {
	Type MessageType `json:"type"`
}

type MessageAddItem struct {
	Message
	ItemName string `json:"name"`
}

func GetMessageType(byt []byte) (MessageType, error) {
	var message Message
	err := json.Unmarshal(byt, &message)
	if err != nil {
		return MessageTypeUnknown, fmt.Errorf("failed to parse JSON message: %w", err)
	}

	return message.Type, nil
}

func ParseMessageAddItem(byt []byte) (*MessageAddItem, error) {
	var message MessageAddItem
	err := json.Unmarshal(byt, &message)
	if err != nil {
		return nil, fmt.Errorf("failed to parse JSON message: %w", err)
	}

	return &message, nil
}
