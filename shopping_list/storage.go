package shopping_list

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
)

type AppData struct {
	ShoppingList ShoppingList `json:"shopping_list"`
	Favorites    Favorites    `json:"favorites"`
}

func LoadAppData() (AppData, error) {
	appData := AppData{
		ShoppingList: ShoppingList{Items: make([]Item, 0)},
		Favorites:    Favorites{},
	}

	jsonFile, err := os.Open("data.json")
	if err != nil {
		log.Println("data.json does not exist, returning empty result")
		return appData, nil
	}

	byteVal, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		return appData, fmt.Errorf("failed to read data.json: %w", err)
	}

	err = json.Unmarshal(byteVal, &appData)
	if err != nil {
		return appData, fmt.Errorf("failed to unmarshal app data: %w", err)
	}

	return appData, nil
}

func SaveAppData(appData *AppData) error {
	jsonByte, err := json.MarshalIndent(appData, "", " ")
	if err != nil {
		return fmt.Errorf("failed to marshal app data: %w", err)
	}

	err = ioutil.WriteFile("data.json", jsonByte, 0644)
	if err != nil {
		return fmt.Errorf("failed to save app data: %w", err)
	}

	return nil
}
