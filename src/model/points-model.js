import Observable from '../framework/observable.js';
import {UpdateType} from '../const.js';

export default class PointsModel extends Observable {
  #points = [];
  #destinations = [];
  #offersByType = [];

  #tripApiService = null;

  constructor({tripApiService}) {
    super();

    this.#tripApiService = tripApiService;
  }

  async init() {
    try {
      const [
        points,
        destinations,
        offersByType,
      ] = await Promise.all([
        this.#tripApiService.points,
        this.#tripApiService.destinations,
        this.#tripApiService.offers,
      ]);

      this.#points = points;
      this.#destinations = destinations;
      this.#offersByType = offersByType;
    } catch (err) {
      this.#points = [];
      this.#destinations = [];
      this.#offersByType = [];
    }

    this._notify(UpdateType.INIT);
  }

  getPoints() {
    return this.#points;
  }

  setPoints(updateType, points) {
    this.#points = points;

    this._notify(updateType);
  }

  async updatePoint(updateType, updatedPoint) {
    const index = this.#points.findIndex((point) => point.id === updatedPoint.id);

    if (index === -1) {
      throw new Error('Can\'t update unexisting point');
    }

    try {
      const response = await this.#tripApiService.updatePoint(updatedPoint);

      this.#points = [
        ...this.#points.slice(0, index),
        response,
        ...this.#points.slice(index + 1),
      ];

      this._notify(updateType, response);
    } catch (err) {
      throw new Error('Can\'t update point');
    }
  }

  addPoint(updateType, newPoint) {
    this.#points = [
      newPoint,
      ...this.#points,
    ];

    this._notify(updateType, newPoint);
  }

  deletePoint(updateType, deletedPoint) {
    const index = this.#points.findIndex((point) => point.id === deletedPoint.id);

    if (index === -1) {
      throw new Error('Can\'t delete unexisting point');
    }

    this.#points = [
      ...this.#points.slice(0, index),
      ...this.#points.slice(index + 1),
    ];

    this._notify(updateType);
  }

  getDestinations() {
    return this.#destinations;
  }

  getOffersByTypeList() {
    return this.#offersByType;
  }

  getDestinationById(id) {
    return this.#destinations.find((destination) => destination.id === id);
  }

  getOffersByType(type) {
    return this.#offersByType.find((offersBlock) => offersBlock.type === type);
  }
}
