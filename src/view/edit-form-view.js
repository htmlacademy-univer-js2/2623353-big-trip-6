import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import dayjs from 'dayjs';
import flatpickr from 'flatpickr';
import he from 'he';
import 'flatpickr/dist/flatpickr.min.css';
import {POINT_TYPES} from '../const.js';

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

const EDIT_DATE_FORMAT = 'DD/MM/YY HH:mm';
const FLATPICKR_DATE_FORMAT = 'd/m/y H:i';

const formatEditDateTime = (isoString) => isoString ? dayjs(isoString).format(EDIT_DATE_FORMAT) : '';

const capitalize = (value) => `${value[0].toUpperCase()}${value.slice(1)}`;

const createPhotosTemplate = (pictures = []) => {
  if (!pictures.length) {
    return '';
  }

  return `
    <div class="event__photos-container">
      <div class="event__photos-tape">
        ${pictures.map((picture) => `
          <img
            class="event__photo"
            src="${he.encode(String(picture.src))}"
            alt="${he.encode(String(picture.description))}"
          >
        `).join('')}
      </div>
    </div>
  `;
};

const createOfferSelectorTemplate = (offer, isChecked, pointId, isDisabled) => `
  <div class="event__offer-selector">
    <input
      class="event__offer-checkbox visually-hidden"
      id="event-offer-${offer.id}-${pointId}"
      type="checkbox"
      name="event-offer-${offer.id}"
      data-offer-id="${offer.id}"
      ${isChecked ? 'checked' : ''}
      ${isDisabled ? 'disabled' : ''}
    >
    <label class="event__offer-label" for="event-offer-${offer.id}-${pointId}">
      <span class="event__offer-title">${he.encode(String(offer.title))}</span>
      &plus;&euro;&nbsp;
      <span class="event__offer-price">${offer.price}</span>
    </label>
  </div>
`;

const createTypeItemTemplate = (type, currentType, pointId, isDisabled) => `
  <div class="event__type-item">
    <input
      id="event-type-${type}-${pointId}"
      class="event__type-input visually-hidden"
      type="radio"
      name="event-type-${pointId}"
      value="${type}"
      ${type === currentType ? 'checked' : ''}
      ${isDisabled ? 'disabled' : ''}
    >
    <label class="event__type-label event__type-label--${type}" for="event-type-${type}-${pointId}">
      ${capitalize(type)}
    </label>
  </div>
`;

const createOffersSectionTemplate = ({availableOffers, state}) => {
  if (!availableOffers.length) {
    return '';
  }

  return `
    <section class="event__section event__section--offers">
      <h3 class="event__section-title event__section-title--offers">Offers</h3>
      <div class="event__available-offers">
        ${availableOffers
    .map((offer) => createOfferSelectorTemplate(
      offer,
      state.offers.includes(offer.id),
      state.id,
      state.isDisabled
    ))
    .join('')}
      </div>
    </section>
  `;
};

const createDestinationSectionTemplate = (destination) => {
  if (!destination) {
    return '';
  }

  return `
    <section class="event__section event__section--destination">
      <h3 class="event__section-title event__section-title--destination">Destination</h3>
      <p class="event__destination-description">${he.encode(destination.description ?? '')}</p>
      ${createPhotosTemplate(destination.pictures)}
    </section>
  `;
};

const createEditFormTemplate = ({state, destinations, offersByType, isNewPoint}) => {
  const icon = TYPE_TO_ICON[state.type] ?? 'flight';

  const destination = destinations.find((item) => item.id === state.destination) ?? null;
  const destinationName = destination ? destination.name : '';

  const offersBlock = offersByType.find((item) => item.type === state.type);
  const availableOffers = offersBlock ? offersBlock.offers : [];

  const offersSectionTemplate = createOffersSectionTemplate({
    availableOffers,
    state,
  });

  const destinationSectionTemplate = createDestinationSectionTemplate(destination);

  const detailsTemplate = offersSectionTemplate || destinationSectionTemplate
    ? `
      <section class="event__details">
        ${offersSectionTemplate}
        ${destinationSectionTemplate}
      </section>
    `
    : '';

  const startValue = formatEditDateTime(state.dateFrom);
  const endValue = formatEditDateTime(state.dateTo);

  const saveButtonText = state.isSaving ? 'Saving...' : 'Save';

  let resetButtonText = 'Delete';

  if (isNewPoint) {
    resetButtonText = 'Cancel';
  } else if (state.isDeleting) {
    resetButtonText = 'Deleting...';
  }

  return `
<li class="trip-events__item">
  <form class="event event--edit" action="#" method="post" autocomplete="off">
    <header class="event__header">
      <div class="event__type-wrapper">
        <label class="event__type event__type-btn" for="event-type-toggle-${state.id}">
          <span class="visually-hidden">Choose event type</span>
          <img
            class="event__type-icon"
            width="17"
            height="17"
            src="img/icons/${icon}.png"
            alt="Event type icon"
          >
        </label>

        <input
          class="event__type-toggle visually-hidden"
          id="event-type-toggle-${state.id}"
          type="checkbox"
          ${state.isDisabled ? 'disabled' : ''}
        >

        <div class="event__type-list">
          <fieldset class="event__type-group">
            <legend class="visually-hidden">Event type</legend>
            ${POINT_TYPES
    .map((type) => createTypeItemTemplate(type, state.type, state.id, state.isDisabled))
    .join('')}
          </fieldset>
        </div>
      </div>

      <div class="event__field-group event__field-group--destination">
        <label class="event__label event__type-output" for="event-destination-${state.id}">
          ${capitalize(state.type)}
        </label>
        <input
          class="event__input event__input--destination"
          id="event-destination-${state.id}"
          type="text"
          name="event-destination"
          value="${he.encode(destinationName)}"
          list="destination-list-${state.id}"
          required
          ${state.isDisabled ? 'disabled' : ''}
        >
        <datalist id="destination-list-${state.id}">
          ${destinations.map((item) => `<option value="${he.encode(String(item.name))}"></option>`).join('')}
        </datalist>
      </div>

      <div class="event__field-group event__field-group--time">
        <label class="visually-hidden" for="event-start-time-${state.id}">From</label>
        <input
          class="event__input event__input--time"
          id="event-start-time-${state.id}"
          type="text"
          name="event-start-time"
          value="${startValue}"
          required
          ${state.isDisabled ? 'disabled' : ''}
        >
        —
        <label class="visually-hidden" for="event-end-time-${state.id}">To</label>
        <input
          class="event__input event__input--time"
          id="event-end-time-${state.id}"
          type="text"
          name="event-end-time"
          value="${endValue}"
          required
          ${state.isDisabled ? 'disabled' : ''}
        >
      </div>

      <div class="event__field-group event__field-group--price">
        <label class="event__label" for="event-price-${state.id}">
          <span class="visually-hidden">Price</span>
          €
        </label>
        <input
          class="event__input event__input--price"
          id="event-price-${state.id}"
          type="text"
          name="event-price"
          value="${state.basePrice}"
          inputmode="numeric"
          pattern="[0-9]*"
          ${state.isDisabled ? 'disabled' : ''}
        >
      </div>

      <button
        class="event__save-btn btn btn--blue"
        type="submit"
        ${state.isDisabled ? 'disabled' : ''}
      >
        ${saveButtonText}
      </button>

      <button
        class="event__reset-btn"
        type="button"
        ${state.isDisabled ? 'disabled' : ''}
      >
        ${resetButtonText}
      </button>

      ${isNewPoint
    ? ''
    : `
      <button
        class="event__rollup-btn"
        type="button"
        ${state.isDisabled ? 'disabled' : ''}
      >
        <span class="visually-hidden">Close event</span>
      </button>
    `}
    </header>

    ${detailsTemplate}
  </form>
</li>
  `;
};

export default class EditFormView extends AbstractStatefulView {
  #destinations = [];
  #offersByType = [];
  #isNewPoint = false;

  #handleFormSubmit = null;
  #handleRollupClick = null;
  #handleDeleteClick = null;

  #startDatepicker = null;
  #endDatepicker = null;

  constructor({
    point,
    destinations,
    offersByType,
    isNewPoint = false,
    onFormSubmit,
    onRollupClick,
    onDeleteClick,
  }) {
    super();

    this._setState(EditFormView.parsePointToState(point));

    this.#destinations = destinations;
    this.#offersByType = offersByType;
    this.#isNewPoint = isNewPoint;

    this.#handleFormSubmit = onFormSubmit;
    this.#handleRollupClick = onRollupClick;
    this.#handleDeleteClick = onDeleteClick;

    this._restoreHandlers();
  }

  get template() {
    return createEditFormTemplate({
      state: this._state,
      destinations: this.#destinations,
      offersByType: this.#offersByType,
      isNewPoint: this.#isNewPoint,
    });
  }

  removeElement() {
    this.#destroyDatepickers();
    super.removeElement();
  }

  reset(point) {
    this.updateElement(EditFormView.parsePointToState(point));
  }

  setSaving() {
    this.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  }

  setDeleting() {
    this.updateElement({
      isDisabled: true,
      isDeleting: true,
    });
  }

  setAborting() {
    const resetFormState = () => {
      this.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.shake(resetFormState);
  }

  _restoreHandlers() {
    this.element.querySelector('form')?.addEventListener('submit', this.#formSubmitHandler);
    this.element.querySelector('.event__reset-btn')?.addEventListener('click', this.#deleteClickHandler);
    this.element.querySelector('.event__rollup-btn')?.addEventListener('click', this.#rollupClickHandler);

    this.element.querySelector('.event__type-group')?.addEventListener('change', this.#typeChangeHandler);
    this.element.querySelector('.event__input--destination')?.addEventListener('change', this.#destinationChangeHandler);
    this.element.querySelector('.event__input--price')?.addEventListener('input', this.#priceInputHandler);
    this.element.querySelector('.event__available-offers')?.addEventListener('change', this.#offersChangeHandler);

    this.#setDatepickers();
  }

  #destroyDatepickers() {
    if (this.#startDatepicker) {
      this.#startDatepicker.destroy();
      this.#startDatepicker = null;
    }

    if (this.#endDatepicker) {
      this.#endDatepicker.destroy();
      this.#endDatepicker = null;
    }
  }

  #setDatepickers() {
    this.#destroyDatepickers();

    const startInput = this.element.querySelector(`#event-start-time-${this._state.id}`);
    const endInput = this.element.querySelector(`#event-end-time-${this._state.id}`);

    if (!startInput || !endInput) {
      return;
    }

    this.#startDatepicker = flatpickr(startInput, {
      enableTime: true,
      dateFormat: FLATPICKR_DATE_FORMAT,
      'time_24hr': true,
      defaultDate: this._state.dateFrom || null,
      maxDate: this._state.dateTo || null,
      onChange: this.#startDateChangeHandler,
    });

    this.#endDatepicker = flatpickr(endInput, {
      enableTime: true,
      dateFormat: FLATPICKR_DATE_FORMAT,
      'time_24hr': true,
      defaultDate: this._state.dateTo || null,
      minDate: this._state.dateFrom || null,
      onChange: this.#endDateChangeHandler,
    });
  }

  #startDateChangeHandler = ([userDate]) => {
    if (!userDate) {
      return;
    }

    this._setState({
      dateFrom: userDate.toISOString(),
    });

    this.#endDatepicker?.set('minDate', userDate);
  };

  #endDateChangeHandler = ([userDate]) => {
    if (!userDate) {
      return;
    }

    this._setState({
      dateTo: userDate.toISOString(),
    });

    this.#startDatepicker?.set('maxDate', userDate);
  };

  #formSubmitHandler = (evt) => {
    evt.preventDefault();

    if (this._state.isDisabled) {
      return;
    }

    const destinationInputValue = this.element.querySelector('.event__input--destination')?.value;
    const foundDestination = this.#destinations.find((destination) => destination.name === destinationInputValue);

    if (!foundDestination) {
      this.shake();
      return;
    }

    this._setState({
      destination: foundDestination.id,
    });

    if (!this._state.dateFrom || !this._state.dateTo) {
      this.shake();
      return;
    }

    if (dayjs(this._state.dateTo).isBefore(dayjs(this._state.dateFrom))) {
      this.shake();
      return;
    }

    this.#handleFormSubmit?.(EditFormView.parseStateToPoint(this._state));
  };

  #deleteClickHandler = (evt) => {
    evt.preventDefault();

    if (this._state.isDisabled) {
      return;
    }

    this.#handleDeleteClick?.(EditFormView.parseStateToPoint(this._state));
  };

  #rollupClickHandler = (evt) => {
    evt.preventDefault();

    if (this._state.isDisabled) {
      return;
    }

    this.#handleRollupClick?.();
  };

  #typeChangeHandler = (evt) => {
    const newType = evt.target.value;

    this.updateElement({
      type: newType,
      offers: [],
    });
  };

  #destinationChangeHandler = (evt) => {
    const value = evt.target.value;
    const foundDestination = this.#destinations.find((destination) => destination.name === value);

    if (!foundDestination) {
      this._setState({
        destination: null,
      });
      return;
    }

    this.updateElement({
      destination: foundDestination.id,
    });
  };

  #priceInputHandler = (evt) => {
    const onlyNumbers = evt.target.value.replace(/\D/g, '');

    if (evt.target.value !== onlyNumbers) {
      evt.target.value = onlyNumbers;
    }

    this._setState({
      basePrice: onlyNumbers === '' ? 0 : Number(onlyNumbers),
    });
  };

  #offersChangeHandler = (evt) => {
    const target = evt.target;

    if (!target || target.type !== 'checkbox') {
      return;
    }

    const offerId = target.dataset.offerId;

    const nextOffers = target.checked
      ? [...this._state.offers, offerId]
      : this._state.offers.filter((id) => id !== offerId);

    this._setState({
      offers: nextOffers,
    });
  };

  static parsePointToState(point) {
    return {
      ...point,
      destination: point.destination ?? null,
      offers: point.offers ? [...point.offers] : [],
      dateFrom: point.dateFrom ?? null,
      dateTo: point.dateTo ?? null,
      basePrice: point.basePrice ?? 0,
      isDisabled: false,
      isSaving: false,
      isDeleting: false,
    };
  }

  static parseStateToPoint(state) {
    const point = {
      ...state,
      offers: [...state.offers],
      basePrice: Number(state.basePrice),
    };

    delete point.isDisabled;
    delete point.isSaving;
    delete point.isDeleting;

    return point;
  }
}
