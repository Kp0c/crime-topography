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

    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'style.css');

    shadow.appendChild(linkElem);
  }

  connectedCallback() {
    if (this.isConnected) {
      this.#render();
    }
  }

  #render() {
    const chart = document.createElement('table');
    chart.classList.add('chart');

    const barRow = document.createElement('tr');

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
      })
      // bar.addEventListener('click', this.barClick.bind(this, new Date(sortedDates[i])));

      const affectedNumber = todayEvents.reduce((acc, event) => {
        return acc + event.affected_number_sum;
      }, 0);

      const height = Math.round(100 * affectedNumber / maxAffectedNumbers);
      bar.style.height = `${height}%`;

      barData.appendChild(bar);
      barRow.appendChild(barData);
    }

    chart.appendChild(barRow);

    const previousTable = this.shadowRoot.querySelector('table');
    if (previousTable) {
      this.shadowRoot.removeChild(previousTable);
    }

    this.shadowRoot.appendChild(chart);
  }
}

