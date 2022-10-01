import template from './chart.html?raw';
import styles from './chart.css?raw';

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
  }

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

      bar.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('day-selected', {
          detail: {
            day: sortedDates[i],
          }
        }));

        if (this.#selectedBar) {
          this.#selectedBar.classList.remove('chart__bar--selected');
        }

        this.#selectedBar = bar;

        this.#selectedBar.classList.add('chart__bar--selected');
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

    setTimeout(() => {
      this.#selectLastDay();
    });
  }

  /**
   * Selects last day in chart
   */
  #selectLastDay() {
    const lastBar = this.shadowRoot.querySelector('.chart td:last-child .chart__bar');
    lastBar?.click();
  }
}

