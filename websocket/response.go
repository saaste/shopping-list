package websocket

import (
	"encoding/json"
	"log"
)

type ResponseType string

const (
	ResponseTypeUnknown          ResponseType = "UNKNOWN"
	ResponseTypeListUpdated      ResponseType = "LIST_UPDATED"
	ResponseTypeFavoritesUpdated ResponseType = "FAVORITES_UPDATED"
)

type Response struct {
	Type ResponseType `json:"type"`
	Body interface{}  `json:"body"`
}

func (i *Response) ToJson() string {
	jsonByte, err := json.Marshal(i)
	if err != nil {
		log.Printf("faild to marshal Response to JSON: %v", err)
		return `{"type":"UNKNOWN","body":{}}`
	}
	return string(jsonByte)
}
