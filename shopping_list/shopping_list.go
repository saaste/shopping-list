package shopping_list

import (
	"encoding/json"
	"log"
	"strings"
)

type ShoppingList struct {
	Items []Item `json:"items"`
}

type Item struct {
	ID      string `json:"id"`
	Checked bool   `json:"checked"`
	Name    string `json:"name"`
}

func (i *ShoppingList) Add(item Item) bool {
	name := strings.ToLower(item.Name)
	for _, it := range i.Items {
		if strings.ToLower(it.Name) == name {
			return false
		}
	}
	i.Items = append(i.Items, item)
	return true
}

func (i *ShoppingList) ToJson() string {
	jsonByte, err := json.Marshal(i)
	if err != nil {
		log.Printf("faild to marshal Items to JSON: %v", err)
		return `{"items":[]}`
	}
	return string(jsonByte)
}
