export class Map extends HTMLElement {

  /**
   * events to render
   *
   * @private
   * @type {CrimeEvent[]}
   */
  #events = [];

  /**
   * Container
   *
   * @private
   * @type {HTMLElement}
   */
  #container = null;

  /**
   * set events and render
   *
   * @param {CrimeEvent[]} events
   */
  set events(events) {
    this.#events = events;
    this.#render();
  }

  constructor() {
    super();

    const shadow = this.attachShadow({mode: 'open'});

    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'style.css');

    this.#container = document.createElement('div');
    this.#container.classList.add('map--container');

    shadow.appendChild(linkElem);

    const mapBackground = document.createElement('img');
    mapBackground.src = '/assets/images/ukraine-map.svg';
    mapBackground.alt = 'Ukraine map';

    this.#container.appendChild(mapBackground);

    shadow.appendChild(this.#container);
  }

  connectedCallback() {
    if (this.isConnected) {
      this.#render();
    }
  }

  #render() {
    const ukraineBoundaries = {
      latMin: 44.25,
      latMax: 52.37,
      lonMin: 22.25,
      lonMax: 40.25,
    };
    const ranges = {
      latRange: ukraineBoundaries.latMax - ukraineBoundaries.latMin,
      lonRange: ukraineBoundaries.lonMax - ukraineBoundaries.lonMin,
    };

    // clear all dots from the map
    this.#container.querySelectorAll('.map--dot').forEach((dot) => dot.remove());

    this.#events
      .filter((event) => event.lat && event.lon)
      .forEach(event => {
      const eventDot = document.createElement('div');
      eventDot.classList.add('map--dot');

      eventDot.style.bottom = `${(event.lat - ukraineBoundaries.latMin) / ranges.latRange * 100}%`;
      eventDot.style.left = `${(event.lon - ukraineBoundaries.lonMin) / ranges.lonRange * 100}%`;

      this.#container.appendChild(eventDot);
    });
  }
}

