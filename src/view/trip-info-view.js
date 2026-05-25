import AbstractView from '../framework/view/abstract-view.js';
import he from 'he';

const createTripInfoTemplate = ({title, dates, price}) => `
  <section class="trip-main__trip-info trip-info">
    <div class="trip-info__main">
      <h1 class="trip-info__title">${he.encode(title)}</h1>

      <p class="trip-info__dates">${dates}</p>
    </div>

    <p class="trip-info__cost">
      Total: &euro;&nbsp;<span class="trip-info__cost-value">${price}</span>
    </p>
  </section>
`;

export default class TripInfoView extends AbstractView {
  #title = '';
  #dates = '';
  #price = 0;

  constructor({title, dates, price}) {
    super();

    this.#title = title;
    this.#dates = dates;
    this.#price = price;
  }

  get template() {
    return createTripInfoTemplate({
      title: this.#title,
      dates: this.#dates,
      price: this.#price,
    });
  }
}
