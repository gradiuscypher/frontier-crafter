# frontier-crafter
App to help keep track of the things you want to make in EVE Frontier

# High level ideas


# Notes
## Where is the blueprint database?
It can be found in the game's static data. 
- On MacOS, the file path to the static files are `/Users/<USERNAME>/Library/Application Support/EVE Frontier/SharedCache/ResFiles`.  
- On MacOS, the index of static files can be found here `/Users/<USERNAME>/Library/Application Support/EVE Frontier/SharedCache/stillness/EVE.app/Contents/Resources/build`
- Search this file for `blueprints.static`, that will point to an SQLite3 DB, for example, it's currently `,f0/f016514b481ba503_d6d8f01e26b7b33e4154efe9833c2143`

## Where can I find the item types and human-readable names?
Using CCPs types API - https://docs.evefrontier.com/SwaggerWorldApi


# TODO
## Now
- Crafting planner
  - Delete target items from the session and remove ingredients (ui/api)
  - Need to be able to manually set available ingredents as well

## Next Up
- Tracking progress with SmartCharacters
- Organize project TODO

## Backlog
- Progress bars and more displays?
- Metrics tracking?
- Better backend logging
- Group crafting
- Use SmartCharacters to track overall progress or available resources
- Allow player to track crafting recipes and what raw mats are needed
- Add more than one BP to track all mats
- Autocomplete API so it's easy to search for item names
- Track how many trips something will be based on cargo hold and mass of items
- Collaboration tooling
  - Track requests
  - Track resources that a user puts in
  - Track progress
- Player requests that can notify on discord?