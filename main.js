import './style.css'
import {EventsService} from "./event.service.js";
import {Chart} from "./components/chart.js";
import {Map} from "./components/map.js";

document.querySelector('#app').innerHTML = `
  <div class="main-container">
    <h1>Crime topography</h1>
    <div class="content">
      <div class="stats-container">
        <div class="stats">
          <div class="stats__item">
            <span class="stats__count">1 234</span>
            <span class="stats__title">Killed Militarists</span>
          </div>
          <div class="stats__item">
            <span class="stats__count">3 280</span>
            <span class="stats__title">Killed doctors</span>
          </div>
          <div class="stats__item">
            <span class="stats__count">3 280</span>
            <span class="stats__title">Killed doctors</span>
          </div>
          <div class="stats__item">
            <span class="stats__count">3 280</span>
            <span class="stats__title">Killed doctors</span>
          </div>
        </div>
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

const eventService = new EventsService();
await eventService.init('/assets/data/events.json', '/assets/data/names.json', navigator.language);

const chart = document.querySelector('ct-chart');
const map = document.querySelector('ct-map');

chart.events = eventService.getLastDays(100);

chart.addEventListener('day-selected', (event) => {
  map.events = eventService.getAllEventsForDay(new Date(event.detail.day));
});

