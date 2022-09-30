import './style.css'
import {EventsService} from "./event.service.js";
import {Chart} from "./components/chart.js";
import {Map} from "./components/map.js";
import {Stats} from "./components/stats.js";

document.querySelector('#app').innerHTML = `
  <div class="main-container">
    <h1>Crime topography</h1>
    <div class="content">
      <div class="stats-container">
        <ct-stats></ct-stats>
      </div>
      <div class="map-container">
        <ct-map></ct-map>
      </div>
    </div>
    <ct-chart></ct-chart>
  </div>
`

window.customElements.define('ct-chart', Chart);
window.customElements.define('ct-map', Map);
window.customElements.define('ct-stats', Stats);

const eventService = new EventsService();
await eventService.init('/assets/data/events.json', '/assets/data/names.json', navigator.language);

const chart = document.querySelector('ct-chart');
const map = document.querySelector('ct-map');
const stats = document.querySelector('ct-stats');

chart.events = eventService.getLastDays(100);

chart.addEventListener('day-selected', (event) => {
  map.events = eventService.getAllEventsForDay(new Date(event.detail.day));
  stats.events = eventService.getAllEventsForDay(new Date(event.detail.day));
});

stats.names = eventService.getAllNames();
