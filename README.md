# Shopping List

A simple shopping list application written in [Go](https://go.dev/) that allows multiple users to edit the list at the same time.

## Background
My partner and I used to manage our own shopping lists in different apps. Before one of us went to shopping, we had to check with the other to see if there is was anything to add to the list. And if one of us was already at the store, we would have to call or text if we wanted to make sure we got the items missing from the list.

With the application, the shopping list can be updated from anywhere and updates are instantly visible to everyone. There is no need to manage multiple shopping lists.

I created this application for our company's hackathon, where the goal was to create an application that improves productivity, using languages or techniques you have zero or very little experience with. The focus was on learning something new.

I am a backend developer, so here are the things I learned while building the application:
- Websockets using Go and vanilla JavaScript
- Drag and drop interface
- Light and dark mode detection and handling
- Designing for different screen sizes
- PWA applications

I did not want to use any JavaScript libraries, so everything is implemented using vanilla JavaScript. Yes, it was a painful experience.

## Features
- Real-time updates on all devices using websockets
- Drag and drop sorting of items
- Automatic favorites management based on the usage
- Simple and easy to use interface
- Data stored to a single file - no database needed!
- Light and dark mode
- Mobile friendly
- PWA support