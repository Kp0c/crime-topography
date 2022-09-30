export class Stats extends HTMLElement {

  /**
   * events to render
   *
   * @private
   * @type {CrimeEvent[]}
   */
  #events = [];

  /**
   * names
   *
   * @private
   * @type {Name}
   */
  #names = null;

  /**
   * Container
   *
   * @private
   * @type {HTMLElement}
   */
  #container = null;

  set events(events) {
    this.#events = events;
    this.#render();
  }

  set names(names) {
    this.#names = names;
    this.#render();
  }

  constructor() {
    super();

    const shadow = this.attachShadow({mode: 'open'});

    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'style.css');

    this.#container = document.createElement('div');
    this.#container.classList.add('stats-container');

    shadow.appendChild(this.#container);

    shadow.appendChild(linkElem);
  }

  connectedCallback() {
    if (this.isConnected) {
      this.#render();
    }
  }

  #render() {
    if (this.#events.length === 0 || this.#names === null) {
      return;
    }

    while (this.#container.firstChild) {
      this.#container.removeChild(this.#container.firstChild);
    }

    const stats = document.createElement('div');
    stats.classList.add('stats');

    // group events by affected_type
    const affectedTypes = this.#events
      .filter((event) => event.affected_type !== null)
      .reduce((acc, event) => {
      if (acc[event.affected_type]) {
        acc[event.affected_type].push(event);
      } else {
        acc[event.affected_type] = [event];
      }

      return acc;
    }, {});

    // for each affected type
    Object.keys(affectedTypes).forEach((affectedType) => {
      const name = this.#names.affected_type[affectedType];

      const statItem = document.createElement('div');
      statItem.classList.add('stats__item');

      const statItemTitle = document.createElement('span');
      statItemTitle.classList.add('stats__item-title');
      statItemTitle.textContent = name;

      const statItemValue = document.createElement('span');
      statItemValue.classList.add('stats__item-count');
      statItemValue.textContent = affectedTypes[affectedType].reduce((acc, event) => {
        return acc + event.affected_number_sum;
      }, 0);

      statItem.appendChild(statItemValue);
      statItem.appendChild(statItemTitle);

      stats.appendChild(statItem);
    });

    this.#container.appendChild(stats);
  }
}

