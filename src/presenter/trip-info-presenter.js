import {render, replace, remove, RenderPosition} from '../framework/render.js';
import TripInfoView from '../view/trip-info-view.js';
import {
  getRouteTitle,
  getTripDates,
  getTripPrice,
} from '../utils/trip.js';

export default class TripInfoPresenter {
  #tripMainContainer = null;
  #pointsModel = null;

  #tripInfoComponent = null;

  constructor({tripMainContainer, pointsModel}) {
    this.#tripMainContainer = tripMainContainer;
    this.#pointsModel = pointsModel;
  }

  init() {
    this.#pointsModel.addObserver(this.#handleModelEvent);

    this.#renderTripInfo();
  }

  #renderTripInfo() {
    const points = this.#pointsModel.getPoints();
    const destinations = this.#pointsModel.getDestinations();
    const offersByType = this.#pointsModel.getOffersByTypeList();

    const prevTripInfoComponent = this.#tripInfoComponent;

    if (points.length === 0) {
      if (prevTripInfoComponent) {
        remove(prevTripInfoComponent);
        this.#tripInfoComponent = null;
      }

      return;
    }

    this.#tripInfoComponent = new TripInfoView({
      title: getRouteTitle(points, destinations),
      dates: getTripDates(points),
      price: getTripPrice(points, offersByType),
    });

    if (prevTripInfoComponent === null) {
      render(this.#tripInfoComponent, this.#tripMainContainer, RenderPosition.AFTERBEGIN);
      return;
    }

    replace(this.#tripInfoComponent, prevTripInfoComponent);
    remove(prevTripInfoComponent);
  }

  #handleModelEvent = () => {
    this.#renderTripInfo();
  };
}
