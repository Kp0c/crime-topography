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
   * @type {Record<string, CrimeEvent>}
   */
  #events = {};

  /**
   * currently selected bar
   * @type {Element}
   */
  #selectedBar = null;

  /**
   * is animation started
   * @type {boolean}
   */
  #isAnimationStarted = false;

  /**
   * animation interval id
   * @type {null|number}
   */
  #animationInterval = null;

  // noinspection JSUnusedGlobalSymbols
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

    const button = this.shadowRoot.querySelector('img');
    button.addEventListener('click', () => {
      this.#toggleAnimation();
    });

    const slider = this.shadowRoot.querySelector('#slider');

    // Performance optimization: fire day select when user stops sliding
    slider.addEventListener('change', () => {
      const bar = this.shadowRoot.querySelector(`td:nth-child(${+slider.value + 1}) .chart__bar`);
      const date = bar.getAttribute('data-date');
      this.#selectDay({
        day: date,
        isAnimationChange: false,
      });
    });

    slider.addEventListener('input', () => {
      this.#updateSliderBubble();
    })
  }

// noinspection JSUnusedGlobalSymbols
  connectedCallback() {
    if (this.isConnected) {
      this.#render();
    }
  }

  #render() {
    const barRow = this.shadowRoot.querySelector('.chart tr');
    barRow.innerHTML = '';

    const maxAffectedNumbers = Object.values(this.#events).reduce((acc, dayEvents) => {
      const affectedNumber = dayEvents.reduce((acc, event) => {
        return event.affected_number ? acc + event.affected_number_sum : acc;
      }, 0);

      return Math.max(acc, affectedNumber);
    }, 0);

    const sortedDates = Object.keys(this.#events).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    for(let i = 0; i < sortedDates.length; i++) {
      const todayEvents = this.#events[sortedDates[i]];
      const barData = document.createElement('td');
      const bar = document.createElement('div');

      bar.classList.add('chart__bar');

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
      barRow.appendChild(barData);
    }

    const slider = this.shadowRoot.querySelector('#slider');
    slider.max = sortedDates.length - 1;

    setTimeout(() => {
      this.#selectLastDay();
    });
  }

  /**
   * Selects last day in chart
   */
  #selectLastDay() {
    const lastBar = this.shadowRoot.querySelector('.chart td:last-child .chart__bar');
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
   */
  #toggleAnimation() {
    this.#isAnimationStarted = !this.#isAnimationStarted;

    const button = this.shadowRoot.querySelector('img');
    if (this.#isAnimationStarted) {
      button.src = '/assets/images/pause.svg';

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
  }

  /**
   * Selects next day in chart
   *
   * @param {object} params
   * @param {boolean} params.isAnimationChange
   *
   * @return {boolean} is next day selected
   */
  #selectNextDay({isAnimationChange}) {
    const nextBar = this.#selectedBar.parentElement.nextElementSibling?.querySelector('.chart__bar');
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
      this.#selectedBar.classList.remove('chart__bar--selected');
    }

    this.#selectedBar = this.shadowRoot.querySelector(`.chart__bar[data-date="${day}"]`);

    const slider = this.shadowRoot.querySelector('#slider');
    slider.value = this.#getBarPosition(this.#selectedBar);
    this.#updateSliderBubble();

    this.#selectedBar.classList.add('chart__bar--selected');
  }

  /**
   * Returns bar position
   *
   * @param {Element} barElement bar element
   *
   * @returns {number} bar position (with 100 columns it is in range 0-99)
   */
  #getBarPosition(barElement) {
    const barRow = this.shadowRoot.querySelector('.chart tr');
    const barRowChildren = Array.from(barRow.children);
    return barRowChildren.indexOf(barElement.parentElement);
  }

  /**
   * Updates slider bubble
   */
  #updateSliderBubble() {
    const slider = this.shadowRoot.querySelector('#slider');

    const bar = this.shadowRoot.querySelector(`td:nth-child(${+slider.value + 1}) .chart__bar`);
    const date = new Date(bar.getAttribute('data-date'));

    const sliderOutput = this.shadowRoot.querySelector('#slider-output');
    sliderOutput.textContent = new Intl.DateTimeFormat(window.navigator.language, {
      dateStyle: 'medium',
    }).format(date);
    const newVal = slider.value / slider.max * 100;

    // Magic numbers to always keep the bubble centered
    sliderOutput.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
  }
}

