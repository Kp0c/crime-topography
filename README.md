# Ukraine Crime topography
Created for Dev Challenge XIX

## Description
This project is a map of war crimes that the <sub><sup>r</sup></sub>ussia (terrorist state) has committed in Ukraine.

## Technical information
The solution is based on pure vanilla js with no libs using [Vite](https://vitejs.dev/) as a bundler.

I'm using component based approach with custom elements. All components are in `src/components` folder. 
- The `ct-map` component is responsible for rendering the map and the markers.
- The `ct-stats` component is responsible for rendering the stats.
- The `ct-chart` component is responsible for rendering the chart and also it is a controller for animations

`main.js` wires all the components together.

`event.service.js` is responsible for receiving data from the server and mutating it into more convenient formats.

`constants.js` contains generic constants for the app. 

## Available functionality
- The map is rendered with markers for each crime
- The stats are rendered with the number of crimes (`affected_number`) per category (`affected_type`)
- The chart is rendered with the last 100 days crimes (1 day/column) with height that depends on `affected_number`
- User can select the date by the bar click or slider drag. It will show all crime since the beginning of the war till the selected day.
- User can run the animation by clicking on the play button

## How to run
1. Clone the repo
2. Run `npm install`
3. Run `npm run dev`
