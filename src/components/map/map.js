import template from './map.html?raw';
import styles from './map.css?raw';
import {ANIMATION_DURATION, UKRAINE_BOUNDARIES, UKRAINE_BOUNDARIES_RANGES} from "../../constants.js";

const templateElem = document.createElement('template');
templateElem.innerHTML = template;

export class Map extends HTMLElement {

  /**
   * events to render
   *
   * @private
   * @type {CrimeEvent[]}
   */
  #events = [];

  /**
   * set events for map
   *
   * @param {CrimeEvent[]} events events
   * @param {boolean} isIncremental is incremental update
   */
  setEvents({events, isIncremental}) {
    if (!isIncremental) {
      this.#events = events;
      this.#render();
    } else {
      this.#events = this.#events.concat(events);
      this.#renderIncremental(events);
    }
  }

  constructor() {
    super();

    const shadow = this.attachShadow({mode: 'open'});

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElem.content.cloneNode(true));

    // respect resize with throttling
    let resizeTimeout = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.#render();
      }, 500);
    });
  }

  connectedCallback() {
    if (this.isConnected) {
      this.#render();
    }
  }

  /**
   * Render map from the scratch
   */
  #render() {
    const canvasElem = this.shadowRoot.querySelector('canvas');

    const ctx = canvasElem.getContext('2d');
    ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);

    const container = this.shadowRoot.querySelector('.map--container');
    canvasElem.width = container.clientWidth;
    canvasElem.height = container.clientHeight;

    const dots = this.#events
      .filter((event) => event.lat && event.lon)
      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
      .map((event) => {
        const x = (event.lon - UKRAINE_BOUNDARIES.lonMin) / UKRAINE_BOUNDARIES_RANGES.lonRange * canvasElem.width;
        const y = canvasElem.height - (event.lat - UKRAINE_BOUNDARIES.latMin) / UKRAINE_BOUNDARIES_RANGES.latRange * canvasElem.height;

        return {
          x,
          y
        };
      });

    this.#animateMap(dots, canvasElem, ANIMATION_DURATION);
  }

  /**
   * Incremental rendering of map
   *
   * @param {CrimeEvent[]} newEvents new events
   */
  #renderIncremental(newEvents) {
    const canvasElem = this.shadowRoot.querySelector('canvas');

    // TODO: extract to separate method
    const dots = newEvents
      .filter((event) => event.lat && event.lon)
      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
      .map((event) => {
        const x = (event.lon - UKRAINE_BOUNDARIES.lonMin) / UKRAINE_BOUNDARIES_RANGES.lonRange * canvasElem.width;
        const y = canvasElem.height - (event.lat - UKRAINE_BOUNDARIES.latMin) / UKRAINE_BOUNDARIES_RANGES.latRange * canvasElem.height;

        return {
          x,
          y
        };
      });

    this.#animateMap(dots, canvasElem, ANIMATION_DURATION);
  }

  /**
   * Animate dots on map
   * @param {{x: number, y: number}[]} dots dots to show (must be in order)
   * @param {HTMLCanvasElement} canvas canvas element
   * @param {number} duration animation duration
   */
  #animateMap(dots, canvas, duration) {
    let startTimestamp = null;
    let lastDotIdx = 0;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      const ctx = canvas.getContext('2d');

      const newLastDotIdx = Math.floor(progress * dots.length);
      const dotsToDraw = dots.slice(lastDotIdx, newLastDotIdx);
      lastDotIdx = newLastDotIdx;

      dotsToDraw.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#C00000';
        ctx.fill();
        ctx.closePath();
      });

      if (progress < 1 && lastDotIdx < dots.length) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }
}
