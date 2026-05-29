import {render, remove, RenderPosition} from '../framework/render.js';
import EditFormView from '../view/edit-form-view.js';
import {UserAction, UpdateType} from '../const.js';

const createBlankPoint = () => ({
  id: `point-${Date.now()}`,
  type: 'flight',
  destination: null,
  offers: [],
  dateFrom: null,
  dateTo: null,
  basePrice: 0,
  isFavorite: false,
});

export default class NewPointPresenter {
  #pointsListContainer = null;

  #destinations = [];
  #offersByType = [];

  #editFormComponent = null;

  #isRequestPending = false;

  #handleDataChange = null;
  #handleDestroy = null;

  constructor({pointsListContainer, onDataChange, onDestroy}) {
    this.#pointsListContainer = pointsListContainer;
    this.#handleDataChange = onDataChange;
    this.#handleDestroy = onDestroy;
  }

  init({destinations, offersByType}) {
    if (this.#editFormComponent) {
      return;
    }

    this.#destinations = destinations;
    this.#offersByType = offersByType;

    this.#editFormComponent = new EditFormView({
      point: createBlankPoint(),
      destinations: this.#destinations,
      offersByType: this.#offersByType,
      isNewPoint: true,
      onFormSubmit: this.#handleFormSubmit,
      onDeleteClick: this.#handleCancelClick,
    });

    render(this.#editFormComponent, this.#pointsListContainer, RenderPosition.AFTERBEGIN);

    document.addEventListener('keydown', this.#escKeyDownHandler);
  }

  destroy() {
    if (!this.#editFormComponent) {
      return;
    }

    remove(this.#editFormComponent);
    this.#editFormComponent = null;

    document.removeEventListener('keydown', this.#escKeyDownHandler);
  }

  #handleFormSubmit = (point) => {
    if (this.#isRequestPending) {
      return;
    }

    this.#isRequestPending = true;
    this.#editFormComponent.setSaving();

    this.#handleDataChange(
      UserAction.ADD_POINT,
      UpdateType.MINOR,
      point,
      null,
      this.#handleError
    );
  };

  #handleCancelClick = () => {
    if (this.#isRequestPending) {
      return;
    }

    this.destroy();
    this.#handleDestroy?.();
  };

  #handleError = () => {
    this.#isRequestPending = false;

    if (!this.#editFormComponent) {
      return;
    }

    this.#editFormComponent.setAborting();
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();

      this.#handleCancelClick();
    }
  };
}
