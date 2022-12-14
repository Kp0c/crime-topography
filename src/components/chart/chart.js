import template from './chart.html?raw';
import styles from './chart.css?raw';
import {ANIMATION_DURATION } from "../../constants.js";

const templateElem = document.createElement('template');
templateElem.innerHTML = template;

export class Chart extends HTMLElement {

  /**
   * events grouped by date to render
   *
   * @private
   * @type {Record<string, CrimeEvent[]>}
   */
  #events = {};

  /**
   * currently selected bar
   *
   * @private
   * @type {Element}
   */
  #selectedBar = null;

  /**
   * is animation started
   *
   * @private
   * @type {boolean}
   */
  #isAnimationStarted = false;

  /**
   * animation interval id
   *
   * @private
   * @type {null|number}
   */
  #animationInterval = null;

  // noinspection JSUnusedGlobalSymbols
  /**
   * set events to show
   * @param {Record<string, CrimeEvent[]>} events
   */
  set events(events) {
    this.#events = events;
    this.#render();
  }

  constructor() {
    super();

    const shadow = this.attachShadow({mode: 'open'});

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElem.content.cloneNode(true));

    const button = this.shadowRoot.getElementById('animation-button');
    button.addEventListener('click', () => {
      this.#toggleAnimation();
    });

    const slider = this.shadowRoot.getElementById('slider');

    // Performance optimization: fire day select only when user stops sliding
    slider.addEventListener('change', () => {
      const bar = this.shadowRoot.querySelector(`td:nth-child(${+slider.value + 1}) .chart-bar`);
      const date = bar.getAttribute('data-date');
      this.#selectDay({
        day: date,
        isAnimationChange: false,
      });
    });

    slider.addEventListener('input', () => {
      this.#updateSliderOutput();
    })
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * it is called by browser when element is connected to DOM
   */
  connectedCallback() {
    if (this.isConnected) {
      this.#render();
    }
  }

  /**
   * Renders the chart
   *
   * @private
   */
  #render() {
    const maxAffectedNumbers = Object.values(this.#events).reduce((acc, dayEvents) => {
      const affectedNumber = dayEvents.reduce((acc, event) => {
        return event.affected_number ? acc + event.affected_number_sum : acc;
      }, 0);

      return Math.max(acc, affectedNumber);
    }, 0);

    const sortedDates = Object.keys(this.#events).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    this.#createColumns(sortedDates, maxAffectedNumbers);

    const slider = this.shadowRoot.getElementById('slider');
    slider.max = sortedDates.length - 1;

    setTimeout(() => {
      this.#selectLastDay();
    });
  }

  /**
   * Create columns for the chart
   *
   * @private
   * @param {string[]} sortedDates sorted dates (these are keys for `#events`)
   * @param {number} maxAffectedNumbers max affected numbers in all days (the highest column value)
   */
  #createColumns(sortedDates, maxAffectedNumbers) {
    const columnsRow = this.shadowRoot.getElementById('columns-row');
    columnsRow.innerHTML = '';

    for (let i = 0; i < sortedDates.length; i++) {
      const todayEvents = this.#events[sortedDates[i]];
      const barData = document.createElement('td');
      const bar = document.createElement('div');

      bar.classList.add('chart-bar');

      bar.setAttribute('data-date', sortedDates[i]);

      bar.addEventListener('click', () => {
        this.#selectDay({
          day: sortedDates[i],
          isAnimationChange: false,
        });
      });

      const affectedNumber = todayEvents.reduce((acc, event) => {
        return acc + event.affected_number_sum;
      }, 0);

      // calculate bar height with min height 5%
      const height = Math.max(Math.round(affectedNumber / maxAffectedNumbers * 100), 5);
      bar.style.height = `${height}%`;

      barData.appendChild(bar);
      columnsRow.appendChild(barData);
    }
  }

  /**
   * Selects last day in chart
   *
   * @private
   */
  #selectLastDay() {
    const lastBar = this.shadowRoot.querySelector('.chart td:last-child .chart-bar');
    if (lastBar) {
      const date = lastBar.getAttribute('data-date');
      this.#selectDay({
        day: date,
        isAnimationChange: false,
      });
    }
  }

  /**
   * Toggles animation
   *
   * @private
   */
  #toggleAnimation() {
    const newValue = !this.#isAnimationStarted;

    const button = this.shadowRoot.getElementById('animation-button');
    if (newValue) {
      button.src = '/assets/images/pause.svg';

      // start animation from the first day if last day is selected
      if (this.#getBarPosition(this.#selectedBar) === Object.values(this.#events).length - 1) {
        const firstBar = this.shadowRoot.querySelector('.chart td:first-child .chart-bar');
        const day = firstBar.getAttribute('data-date');
        this.#selectDay({
          day,
          isAnimationChange: false,
        });
      }

      this.#animationInterval = setInterval(() => {
        const res = this.#selectNextDay({
          isAnimationChange: true
        });

        if (!res) {
          this.#toggleAnimation();
        }
      }, ANIMATION_DURATION);
    } else {
      button.src = '/assets/images/play.svg';

      clearInterval(this.#animationInterval);
    }

    this.#isAnimationStarted = !this.#isAnimationStarted;
  }

  /**
   * Selects next day in chart
   *
   * @private
   * @param {object} params
   * @param {boolean} params.isAnimationChange
   *
   * @return {boolean} is next day selected. False means that no next bar exists
   */
  #selectNextDay({isAnimationChange}) {
    const nextBar = this.#selectedBar.parentElement.nextElementSibling?.querySelector('.chart-bar');
    if (nextBar) {
      const date = nextBar.getAttribute('data-date');
      this.#selectDay({
        day: date,
        isAnimationChange,
      });
      return true;
    }

    return false;
  }

  /**
   * Select day
   *
   * @private
   * @param {object} params
   * @param {string} params.day
   * @param {boolean} params.isAnimationChange
   */
  #selectDay({day, isAnimationChange}) {
    if (!isAnimationChange && this.#isAnimationStarted) {
      this.#toggleAnimation();
    }

    const dayDate = new Date(day);
    this.dispatchEvent(new CustomEvent('day-selected', {
      detail: {
        day: dayDate,
        isAnimationChange
      }
    }));

    if (this.#selectedBar) {
      this.#selectedBar.classList.remove('chart-bar-selected');
    }

    this.#selectedBar = this.shadowRoot.querySelector(`.chart-bar[data-date="${day}"]`);

    const slider = this.shadowRoot.getElementById('slider');
    slider.value = this.#getBarPosition(this.#selectedBar);
    this.#updateSliderOutput();

    this.#selectedBar.classList.add('chart-bar-selected');
  }

  /**
   * Returns bar position
   *
   * @private
   * @param {Element} barElement bar element
   *
   * @returns {number} bar position (with 100 columns it is in range 0-99)
   */
  #getBarPosition(barElement) {
    const columnsRow = this.shadowRoot.getElementById('columns-row');
    const columnsRowChildren = Array.from(columnsRow.children);
    return columnsRowChildren.indexOf(barElement.parentElement);
  }

  /**
   * Updates slider bubble
   *
   * @private
   */
  #updateSliderOutput() {
    const slider = this.shadowRoot.getElementById('slider');

    const bar = this.shadowRoot.querySelector(`td:nth-child(${+slider.value + 1}) .chart-bar`);
    const date = new Date(bar.getAttribute('data-date'));

    const sliderOutput = this.shadowRoot.getElementById('slider-output');
    // noinspection JSCheckFunctionSignatures
    sliderOutput.textContent = new Intl.DateTimeFormat(window.navigator.language, {
      dateStyle: 'medium',
    }).format(date);
    const newVal = slider.value / slider.max * 100;

    // Magic numbers to always keep the output centered
    sliderOutput.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
  }
}

