import AbstractView from '../framework/view/abstract-view.js';
import dayjs from 'dayjs';
import he from 'he';

const TYPE_TO_ICON = {
  taxi: 'taxi',
  bus: 'bus',
  train: 'train',
  ship: 'ship',
  drive: 'drive',
  flight: 'flight',
  'check-in': 'check-in',
  sightseeing: 'sightseeing',
  restaurant: 'restaurant',
};

const DATE_FORMAT = 'MMM DD';
const TIME_FORMAT = 'HH:mm';

const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE;

const DURATION_VALUE_LENGTH = 2;
const DURATION_VALUE_PAD = '0';

const capitalize = (value) => `${value[0].toUpperCase()}${value.slice(1)}`;

const formatDate = (date) => dayjs(date).format(DATE_FORMAT).toUpperCase();

const formatTime = (date) => dayjs(date).format(TIME_FORMAT);

const formatDurationValue = (value) => String(value).padStart(
  DURATION_VALUE_LENGTH,
  DURATION_VALUE_PAD
);

const getDurationInMinutes = (dateFrom, dateTo) => (
  new Date(dateTo) - new Date(dateFrom)
) / MILLISECONDS_IN_MINUTE;

const formatDuration = (dateFrom, dateTo) => {
  const duration = getDurationInMinutes(dateFrom, dateTo);

  if (duration < MINUTES_IN_HOUR) {
    return `${formatDurationValue(duration)}M`;
  }

  if (duration < MINUTES_IN_DAY) {
    const shortDurationHours = Math.floor(duration / MINUTES_IN_HOUR);
    const shortDurationMinutes = duration % MINUTES_IN_HOUR;

    return `${formatDurationValue(shortDurationHours)}H ${formatDurationValue(shortDurationMinutes)}M`;
  }

  const longDurationDays = Math.floor(duration / MINUTES_IN_DAY);
  const longDurationHours = Math.floor((duration % MINUTES_IN_DAY) / MINUTES_IN_HOUR);
  const longDurationMinutes = duration % MINUTES_IN_HOUR;

  return `${formatDurationValue(longDurationDays)}D ${formatDurationValue(longDurationHours)}H ${formatDurationValue(longDurationMinutes)}M`;
};

const createOfferTemplate = (offer) => `
  <li class="event__offer">
    <span class="event__offer-title">${he.encode(String(offer.title))}</span>
    &plus;&euro;&nbsp;
    <span class="event__offer-price">${offer.price}</span>
  </li>
`;

const createOffersTemplate = (selectedOffers) => {
  if (selectedOffers.length === 0) {
    return '';
  }

  return `
    <h4 class="visually-hidden">Offers:</h4>
    <ul class="event__selected-offers">
      ${selectedOffers.map((offer) => createOfferTemplate(offer)).join('')}
    </ul>
  `;
};

const createPointTemplate = ({point, destination, offers}) => {
  const icon = TYPE_TO_ICON[point.type] ?? TYPE_TO_ICON.flight;
  const destinationName = destination ? destination.name : '';

  const selectedOffers = offers.filter((offer) => point.offers.includes(offer.id));

  const dateFrom = he.encode(String(point.dateFrom));
  const dateTo = he.encode(String(point.dateTo));

  return `
<li class="trip-events__item">
  <div class="event">
    <time class="event__date" datetime="${dateFrom}">${formatDate(point.dateFrom)}</time>

    <div class="event__type">
      <img
        class="event__type-icon"
        width="42"
        height="42"
        src="img/icons/${icon}.png"
        alt="Event type icon"
      >
    </div>

    <h3 class="event__title">${capitalize(point.type)} ${he.encode(destinationName)}</h3>

    <div class="event__schedule">
      <p class="event__time">
        <time class="event__start-time" datetime="${dateFrom}">${formatTime(point.dateFrom)}</time>
        &mdash;
        <time class="event__end-time" datetime="${dateTo}">${formatTime(point.dateTo)}</time>
      </p>
      <p class="event__duration">${formatDuration(point.dateFrom, point.dateTo)}</p>
    </div>

    <p class="event__price">
      &euro;&nbsp;<span class="event__price-value">${point.basePrice}</span>
    </p>

    ${createOffersTemplate(selectedOffers)}

    <button
      class="event__favorite-btn ${point.isFavorite ? 'event__favorite-btn--active' : ''}"
      type="button"
    >
      <span class="visually-hidden">Add to favorite</span>
      <svg class="event__favorite-icon" width="28" height="28" viewBox="0 0 28 28">
        <path d="M14 21l-6.16 3.24 1.18-6.86L4 12.5l6.9-1L14 5.26l3.1 6.24 6.9 1-5.02 4.88 1.18 6.86z"/>
      </svg>
    </button>

    <button class="event__rollup-btn" type="button">
      <span class="visually-hidden">Open event</span>
    </button>
  </div>
</li>
  `;
};

export default class PointView extends AbstractView {
  #point = null;
  #destination = null;
  #offers = [];

  #handleEditClick = null;
  #handleFavoriteClick = null;

  constructor({
    point,
    destination,
    offers,
    onEditClick,
    onFavoriteClick,
  }) {
    super();

    this.#point = point;
    this.#destination = destination;
    this.#offers = offers;

    this.#handleEditClick = onEditClick;
    this.#handleFavoriteClick = onFavoriteClick;

    this.element.querySelector('.event__rollup-btn')
      .addEventListener('click', this.#editClickHandler);

    this.element.querySelector('.event__favorite-btn')
      .addEventListener('click', this.#favoriteClickHandler);
  }

  get template() {
    return createPointTemplate({
      point: this.#point,
      destination: this.#destination,
      offers: this.#offers,
    });
  }

  #editClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleEditClick();
  };

  #favoriteClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleFavoriteClick();
  };
}
