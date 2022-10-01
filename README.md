# Ukraine Crime topography
Created for Dev Challenge XIX

## Description

## Technical information
The solution is based on pure vanilla js with no libs using [Vite](https://vitejs.dev/) as a bundler.

I'm using component based approach with custom elements. All components are in `src/components` folder. 
- The `ct-map` component is responsible for rendering the map and the markers.
- The `ct-stats` component is responsible for rendering the stats.
- The `ct-chart` component is responsible for rendering the chart and also it is a controller for animations

`main.js` wires all the components together.

`constants.js` contains generic constants for the app. 

## How to run
1. Clone the repo
2. Run `npm install`
3. Run `npm run dev`
