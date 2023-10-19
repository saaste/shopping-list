package shopping_list

import (
	"encoding/json"
	"log"
	"sort"
	"strings"
)

type Favorites struct {
	Favorites map[string]int `json:"favorites"`
}

func (f *Favorites) Update(name string) {
	nameLower := strings.ToLower(name)
	for k := range f.Favorites {
		if strings.ToLower(k) == nameLower {
			f.Favorites[k] += 1
			return
		}
	}

	if f.Favorites == nil {
		f.Favorites = make(map[string]int)
	}

	f.Favorites[name] = 1
}

func (f *Favorites) Delete(name string) {
	delete(f.Favorites, name)
}

func (f *Favorites) ToSortedList() FavoritesSorted {
	keys := make([]string, 0, len(f.Favorites))
	for key := range f.Favorites {
		keys = append(keys, key)
	}

	sort.SliceStable(keys, func(i, j int) bool {
		return f.Favorites[keys[i]] > f.Favorites[keys[j]]
	})

	return FavoritesSorted(keys)
}

func (f *Favorites) ToJson() string {
	jsonByte, err := json.Marshal(f)
	if err != nil {
		log.Printf("faild to marshal Favorites to JSON: %v", err)
		return `{"favorites":[]}`
	}
	return string(jsonByte)
}

type FavoritesSorted []string

func (f *FavoritesSorted) ToJson() string {
	jsonByte, err := json.Marshal(f)
	if err != nil {
		log.Printf("faild to marshal Favorites to JSON: %v", err)
		return `[]`
	}
	return string(jsonByte)
}
