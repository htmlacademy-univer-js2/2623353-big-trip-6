import {render, replace, remove} from '../framework/render.js';

import PointView from '../view/point-view.js';
import EditFormView from '../view/edit-form-view.js';
import {UserAction, UpdateType} from '../const.js';

const Mode = {
  DEFAULT: 'DEFAULT',
  EDITING: 'EDITING',
};

export default class PointPresenter {
  #pointsListContainer = null;

  #point = null;

  #destinations = [];
  #offersByType = [];

  #pointComponent = null;
  #editFormComponent = null;

  #mode = Mode.DEFAULT;

  #handleDataChange = null;
  #handleModeChange = null;

  constructor({pointsListContainer, onDataChange, onModeChange}) {
    this.#pointsListContainer = pointsListContainer;
    this.#handleDataChange = onDataChange;
    this.#handleModeChange = onModeChange;
  }

  init({point, destinations, offersByType}) {
    this.#point = point;
    this.#destinations = destinations;
    this.#offersByType = offersByType;

    const prevPointComponent = this.#pointComponent;
    const prevEditFormComponent = this.#editFormComponent;

    const destination = this.#destinations.find((item) => item.id === this.#point.destination);
    const offersBlock = this.#offersByType.find((item) => item.type === this.#point.type);
    const offers = offersBlock ? offersBlock.offers : [];

    this.#pointComponent = new PointView({
      point: this.#point,
      destination,
      offers,
      onEditClick: this.#handleEditClick,
      onFavoriteClick: this.#handleFavoriteClick,
    });

    this.#editFormComponent = new EditFormView({
      point: this.#point,
      destinations: this.#destinations,
      offersByType: this.#offersByType,
      onFormSubmit: this.#handleFormSubmit,
      onRollupClick: this.#handleRollupClick,
      onDeleteClick: this.#handleDeleteClick,
    });

    if (prevPointComponent === null || prevEditFormComponent === null) {
      render(this.#pointComponent, this.#pointsListContainer);
      return;
    }

    if (this.#mode === Mode.DEFAULT) {
      if (!prevPointComponent.element.parentElement) {
        render(this.#pointComponent, this.#pointsListContainer);
      } else {
        replace(this.#pointComponent, prevPointComponent);
      }
    }

    if (this.#mode === Mode.EDITING) {
      if (!prevEditFormComponent.element.parentElement) {
        this.#mode = Mode.DEFAULT;
        render(this.#pointComponent, this.#pointsListContainer);
      } else {
        replace(this.#editFormComponent, prevEditFormComponent);
      }
    }

    remove(prevPointComponent);
    remove(prevEditFormComponent);
  }

  destroy() {
    remove(this.#pointComponent);
    remove(this.#editFormComponent);

    document.removeEventListener('keydown', this.#escKeyDownHandler);
  }

  resetView() {
    if (this.#mode !== Mode.DEFAULT) {
      this.#editFormComponent.reset(this.#point);
      this.#replaceFormToPoint();
    }
  }

  #replacePointToForm() {
    if (!this.#pointComponent.element.parentElement) {
      return;
    }

    replace(this.#editFormComponent, this.#pointComponent);
    this.#mode = Mode.EDITING;

    document.addEventListener('keydown', this.#escKeyDownHandler);
  }

  #replaceFormToPoint() {
    if (!this.#editFormComponent.element.parentElement) {
      return;
    }

    replace(this.#pointComponent, this.#editFormComponent);
    this.#mode = Mode.DEFAULT;

    document.removeEventListener('keydown', this.#escKeyDownHandler);
  }

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();

      this.#editFormComponent.reset(this.#point);
      this.#replaceFormToPoint();
    }
  };

  #handleEditClick = () => {
    this.#handleModeChange();
    this.#replacePointToForm();
  };

  #handleRollupClick = () => {
    this.#editFormComponent.reset(this.#point);
    this.#replaceFormToPoint();
  };

  #handleFormSubmit = (updatedPoint) => {
    this.#editFormComponent.setSaving();

    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.PATCH,
      updatedPoint,
      null,
      this.#handleError
    );
  };

  #handleDeleteClick = () => {
    this.#editFormComponent.setDeleting();

    this.#handleDataChange(
      UserAction.DELETE_POINT,
      UpdateType.MINOR,
      this.#point,
      null,
      this.#handleError
    );
  };

  #handleFavoriteClick = () => {
    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.PATCH,
      {
        ...this.#point,
        isFavorite: !this.#point.isFavorite,
      },
      null,
      this.#handleFavoriteError
    );
  };

  #handleError = () => {
    this.#editFormComponent.setAborting();
  };

  #handleFavoriteError = () => {
    this.#pointComponent.shake();
  };
}
