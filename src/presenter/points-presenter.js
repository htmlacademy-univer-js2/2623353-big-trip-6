import {render, remove} from '../framework/render.js';

import SortView from '../view/sort-view.js';
import TripEventsListView from '../view/trip-events-list-view.js';
import EmptyListView from '../view/empty-list-view.js';
import LoadingView from '../view/loading-view.js';

import PointPresenter from './point-presenter.js';
import NewPointPresenter from './new-point-presenter.js';

import {
  EmptyListMessage,
  FilterType,
  SortType,
  UpdateType,
  UserAction,
} from '../const.js';

import {filter} from '../utils/filter.js';

const sortByDay = (a, b) => new Date(a.dateFrom) - new Date(b.dateFrom);

const sortByTime = (a, b) => {
  const durationA = new Date(a.dateTo) - new Date(a.dateFrom);
  const durationB = new Date(b.dateTo) - new Date(b.dateFrom);

  return durationB - durationA;
};

const sortByPrice = (a, b) => b.basePrice - a.basePrice;

export default class PointsPresenter {
  #tripEventsContainer = null;
  #pointsModel = null;
  #filterModel = null;
  #newPointButton = null;

  #tripEventsListComponent = null;
  #sortComponent = null;
  #emptyComponent = null;
  #loadingComponent = new LoadingView();

  #pointPresenters = new Map();
  #newPointPresenter = null;

  #currentSortType = SortType.DAY;
  #isNewPointOpening = false;
  #isLoading = true;

  constructor({tripEventsContainer, pointsModel, filterModel, newPointButton}) {
    this.#tripEventsContainer = tripEventsContainer;
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;
    this.#newPointButton = newPointButton;
  }

  init() {
    this.#pointsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);

    this.#newPointButton.addEventListener('click', this.#handleNewPointButtonClick);
    this.#newPointButton.disabled = true;

    this.#renderBoard();
  }

  #getDestinations() {
    return this.#pointsModel.getDestinations();
  }

  #getOffersByTypeList() {
    return this.#pointsModel.getOffersByTypeList();
  }

  #getFilteredPoints() {
    const currentFilterType = this.#filterModel.getFilter();
    const points = this.#pointsModel.getPoints();

    return filter[currentFilterType](points);
  }

  #getSortedPoints() {
    const points = [...this.#getFilteredPoints()];

    switch (this.#currentSortType) {
      case SortType.TIME:
        return points.sort(sortByTime);
      case SortType.PRICE:
        return points.sort(sortByPrice);
      default:
        return points.sort(sortByDay);
    }
  }

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;

    this.#handleModeChange();
    this.#clearBoard();
    this.#renderBoard();
  };

  #renderBoard() {
    if (this.#isLoading) {
      render(this.#loadingComponent, this.#tripEventsContainer);
      return;
    }

    const points = this.#getSortedPoints();
    const isCreatingNewPoint = this.#newPointPresenter !== null || this.#isNewPointOpening;

    if (points.length === 0 && !isCreatingNewPoint) {
      const currentFilterType = this.#filterModel.getFilter();

      this.#emptyComponent = new EmptyListView({
        message: EmptyListMessage[currentFilterType],
      });

      render(this.#emptyComponent, this.#tripEventsContainer);
      return;
    }

    if (points.length > 0) {
      const sortItems = [
        {
          type: SortType.DAY,
          title: 'Day',
          isChecked: this.#currentSortType === SortType.DAY,
          isDisabled: false,
        },
        {
          type: 'event',
          title: 'Event',
          isChecked: false,
          isDisabled: true,
        },
        {
          type: SortType.TIME,
          title: 'Time',
          isChecked: this.#currentSortType === SortType.TIME,
          isDisabled: false,
        },
        {
          type: SortType.PRICE,
          title: 'Price',
          isChecked: this.#currentSortType === SortType.PRICE,
          isDisabled: false,
        },
        {
          type: 'offers',
          title: 'Offers',
          isChecked: false,
          isDisabled: true,
        },
      ];

      this.#sortComponent = new SortView({
        sortItems,
        onSortTypeChange: this.#handleSortTypeChange,
      });

      render(this.#sortComponent, this.#tripEventsContainer);
    }

    this.#tripEventsListComponent = new TripEventsListView();
    render(this.#tripEventsListComponent, this.#tripEventsContainer);

    this.#renderPoints(points);
  }

  #renderPoints(points) {
    points.forEach((point) => this.#renderPoint(point));
  }

  #renderPoint(point) {
    const pointPresenter = new PointPresenter({
      pointsListContainer: this.#tripEventsListComponent.element,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handleModeChange,
    });

    pointPresenter.init({
      point,
      destinations: this.#getDestinations(),
      offersByType: this.#getOffersByTypeList(),
    });

    this.#pointPresenters.set(point.id, pointPresenter);
  }

  #renderNewPoint() {
    if (!this.#tripEventsListComponent) {
      this.#tripEventsListComponent = new TripEventsListView();
      render(this.#tripEventsListComponent, this.#tripEventsContainer);
    }

    this.#newPointPresenter = new NewPointPresenter({
      pointsListContainer: this.#tripEventsListComponent.element,
      onDataChange: this.#handleViewAction,
      onDestroy: this.#handleNewPointDestroy,
    });

    this.#newPointPresenter.init({
      destinations: this.#getDestinations(),
      offersByType: this.#getOffersByTypeList(),
    });
  }

  #handleViewAction = async (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        await this.#pointsModel.updatePoint(updateType, update);
        break;

      case UserAction.ADD_POINT:
        this.#currentSortType = SortType.DAY;
        this.#removeNewPointForm();
        this.#pointsModel.addPoint(updateType, update);
        break;

      case UserAction.DELETE_POINT:
        this.#pointsModel.deletePoint(updateType, update);
        break;
    }
  };

  #handleModelEvent = (updateType) => {
    switch (updateType) {
      case UpdateType.PATCH:
      case UpdateType.MINOR:
        this.#clearBoard();
        this.#renderBoard();
        break;

      case UpdateType.MAJOR:
        this.#currentSortType = SortType.DAY;
        this.#clearBoard();
        this.#renderBoard();

        if (this.#isNewPointOpening) {
          this.#renderNewPoint();
          this.#isNewPointOpening = false;
        }
        break;

      case UpdateType.INIT:
        this.#isLoading = false;
        this.#newPointButton.disabled = false;
        remove(this.#loadingComponent);
        this.#renderBoard();
        break;
    }
  };

  #handleModeChange = () => {
    this.#pointPresenters.forEach((presenter) => presenter.resetView());
    this.#removeNewPointForm();
  };

  #handleNewPointButtonClick = () => {
    this.#newPointButton.disabled = true;
    this.#isNewPointOpening = true;

    this.#pointPresenters.forEach((presenter) => presenter.resetView());

    this.#currentSortType = SortType.DAY;

    if (this.#filterModel.getFilter() !== FilterType.EVERYTHING) {
      this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
      return;
    }

    this.#clearBoard();
    this.#renderBoard();
    this.#renderNewPoint();

    this.#isNewPointOpening = false;
  };

  #handleNewPointDestroy = () => {
    this.#newPointPresenter = null;
    this.#newPointButton.disabled = false;

    this.#clearBoard({
      resetNewPoint: false,
    });

    this.#renderBoard();
  };

  #removeNewPointForm() {
    if (!this.#newPointPresenter) {
      return;
    }

    this.#newPointPresenter.destroy();
    this.#newPointPresenter = null;
    this.#newPointButton.disabled = false;
  }

  #clearBoard({resetNewPoint = true} = {}) {
    if (resetNewPoint) {
      this.#removeNewPointForm();
    }

    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();

    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
      this.#emptyComponent = null;
    }

    if (this.#sortComponent) {
      remove(this.#sortComponent);
      this.#sortComponent = null;
    }

    if (this.#tripEventsListComponent) {
      remove(this.#tripEventsListComponent);
      this.#tripEventsListComponent = null;
    }
  }
}
