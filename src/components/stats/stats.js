import template from './stats.html?raw';
import styles from './stats.css?raw';
import {ANIMATION_DURATION} from "../../constants.js";

const templateElem = document.createElement('template');
templateElem.innerHTML = template;

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

  set names(names) {
    this.#names = names;
    this.#render();
  }

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

    const statsElement = this.shadowRoot.querySelector('.stats');
    while (statsElement.firstChild) {
      statsElement.removeChild(statsElement.firstChild);
    }

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
      statItem.setAttribute('data-affected-type', affectedType);

      const statItemTitle = document.createElement('span');
      statItemTitle.classList.add('stats__item-title');
      statItemTitle.textContent = name;

      const statItemValue = document.createElement('span');
      statItemValue.classList.add('stats__item-count');

      const count = affectedTypes[affectedType].reduce((acc, event) => {
        return acc + event.affected_number_sum;
      }, 0);

      // statItemValue.textContent = count.toString()
      this.#animateValue(statItemValue, 0, count, ANIMATION_DURATION);

      statItem.appendChild(statItemValue);
      statItem.appendChild(statItemTitle);

      statsElement.appendChild(statItem);
    });
  }

  /**
   * Renders incremental update
   * @param {CrimeEvent[]} newEvents new events
   */
  #renderIncremental(newEvents) {
    if (this.#events.length === 0 || this.#names === null) {
      return;
    }

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

      const statItem = this.shadowRoot.querySelector(`[data-affected-type="${affectedType}"]`);

      if (!statItem) {
        // TODO: extract to method
        const statItem = document.createElement('div');
        statItem.classList.add('stats__item');
        statItem.setAttribute('data-affected-type', affectedType);

        const statItemTitle = document.createElement('span');
        statItemTitle.classList.add('stats__item-title');
        statItemTitle.textContent = name;

        const statItemValue = document.createElement('span');
        statItemValue.classList.add('stats__item-count');
      }

      const statItemValue = statItem.querySelector('.stats__item-count');

      const count = affectedTypes[affectedType].reduce((acc, event) => {
        return acc + event.affected_number_sum;
      }, 0);

      const previousCount = +statItemValue.textContent.replace(/\s/g, '');
      this.#animateValue(statItemValue, previousCount, count, 1000);
    });
  }

  /**
   * Animates number value to the given value
   *
   * @param {HTMLElement} element
   * @param {number} start
   * @param {number} end
   * @param {number} duration
   */
  #animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const newVal = Math.round(progress * (end - start) + start);
      element.innerHTML = newVal.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }
}

