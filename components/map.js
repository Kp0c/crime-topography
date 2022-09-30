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
    mapBackground.classList.add('map--background');

    this.#container.appendChild(mapBackground);

    shadow.appendChild(this.#container);

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

    // clear child canvas
    const canvas = this.#container.querySelector('canvas');
    if (canvas) {
      this.#container.removeChild(canvas);
    }

    const canvasElem = document.createElement('canvas');

    canvasElem.classList.add('map--canvas');
    canvasElem.width = this.#container.clientWidth;
    canvasElem.height = this.#container.clientHeight;

    this.#container.appendChild(canvasElem);

    const dots = this.#events
      .filter((event) => event.lat && event.lon)
      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
      .map((event) => {
        const x = (event.lon - ukraineBoundaries.lonMin) / ranges.lonRange * canvasElem.width;
        const y = canvasElem.height - (event.lat - ukraineBoundaries.latMin) / ranges.latRange * canvasElem.height;

        return {
          x,
          y
        };
      });

    this.#animateMap(dots, canvasElem, 1000);
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

