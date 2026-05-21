import PointsPresenter from './presenter/points-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';

import PointsModel from './model/points-model.js';
import FilterModel from './model/filter-model.js';

import TripApiService from './trip-api-service.js';

const END_POINT = 'https://24.objects.htmlacademy.pro/big-trip';
const AUTHORIZATION = 'Basic big-trip-elmira-2623353';

const tripControlsContainer = document.querySelector('.trip-controls__filters');
const tripEventsContainer = document.querySelector('.trip-events');
const newPointButton = document.querySelector('.trip-main__event-add-btn');

const tripApiService = new TripApiService(END_POINT, AUTHORIZATION);

const pointsModel = new PointsModel({
  tripApiService,
});

const filterModel = new FilterModel();

const filterPresenter = new FilterPresenter({
  filterContainer: tripControlsContainer,
  filterModel,
  pointsModel,
});

const pointsPresenter = new PointsPresenter({
  tripEventsContainer,
  pointsModel,
  filterModel,
  newPointButton,
});

filterPresenter.init();
pointsPresenter.init();

pointsModel.init();
