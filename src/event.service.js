/**
 * Crime Event
 * @typedef {Object} CrimeEvent
 * @property {number} lat
 * @property {number} lon
 * @property {number|null} affected_type
 * @property {number[]} affected_number
 * @property {number} affected_number_sum
 * @property {Date} from
 */

/**
 * @typedef {Object} Name
 * @property {Record<number, string>} affected_type
 * @property {Record<number, string>} event
 * @property {Record<number, string>} object_status
 * @property {Record<number, string>} qualification
 */

export class EventsService {
  /**
   * all events
   * @type {CrimeEvent[]}
   */
  #events = [];

  /**
   * all names
   * @type {Name}
   */
  #names = {};

  /**
   * Initializes data
   * @param {string} dataUrl url to data
   * @param {string} translationUrl url to translation
   * @param {string} language language
   * @returns {Promise<void>}
   */
  async init(dataUrl, translationUrl, language) {
    this.#events = await this.#loadEvents(dataUrl);
    this.#names = await this.#loadNames(translationUrl, language);
  }

  /**
   * Returns all events grouped by date for last `daysCount` days
   * @param {number} daysCount days to return
   * @returns {Record<string, CrimeEvent[]>} crime events grouped by date
   */
  getLastDays(daysCount) {
    const grouped = this.#getByDate();

    const dates = Object.keys(grouped).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    const lastDays = dates.slice(0, daysCount);

    return lastDays.reduce((acc, date) => {
      acc[date] = grouped[date];

      return acc;
    }, {});
  }

  /**
   * Returns all events that happened at `date`
   * @param {Date} date date
   * @returns {CrimeEvent[]} crime events
   */
  getAllEventsForTheDay(date) {
    const grouped = this.#getByDate();

    const dateStr = date.toISOString();

    return grouped[dateStr] ?? [];
  }

  /**
   * Returns all events that happened till the `date`
   * @param {Date} date date
   * @returns {CrimeEvent[]} crime events
   */
  getAllEventsTillTheDay(date) {
    const grouped = this.#getByDate();

    return Object.keys(grouped).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    }).filter((day) => {
      return new Date(day) <= date;
    }).reduce((acc, date) => {
      acc.push(...grouped[date]);

      return acc;
    }, []);
  }

  /**
   * Returns all events grouped by date
   * @returns {Record<string, CrimeEvent[]>} crime events grouped by date
   */
  #getByDate(){
    return this.#events.reduce((acc, event) => {
      const date = event.from.toISOString();

      if (acc[date]) {
        acc[date].push(event);
      } else {
        acc[date] = [event];
      }

      return acc;
    }, {});
  }

  /**
   * Load events from url
   * @param {string} dataUrl
   * @returns {Promise<CrimeEvent[]>} crime events
   */
  async #loadEvents(dataUrl) {
    const response = await fetch(dataUrl)

    const data = await response.json();

    // convert to app format + helpers
    data.forEach((event) => {
      event.from = new Date(event.from);
      event.affected_number = event.affected_number?.map((num) => +num) ?? [];
      event.affected_type = event.affected_type ? +event.affected_type[0] : null;
      event.affected_number_sum = event.affected_number.reduce((acc, num) => acc + num, 0);
    });

    return data;
  }

  /**
   * Load names from url
   * @param {string} translationUrl url to translation
   * @param {string} language language
   * @returns {Promise<Name>} names
   */
  async #loadNames(translationUrl, language) {
    const response = await fetch(translationUrl)

    const data = await response.json();

    let languageKey = Object.keys(data).find((lanKey) => {
      const regex = new RegExp(`^${lanKey}`, 'i');
      return regex.test(language);
    });

    if (!languageKey) {
      languageKey = 'en';
    }

    return data[languageKey];
  }

  getAllNames() {
    return this.#names;
  }
}
