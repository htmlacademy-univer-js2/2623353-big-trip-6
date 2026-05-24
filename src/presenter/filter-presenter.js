import {render, remove} from '../framework/render.js';
import FilterView from '../view/filter-view.js';
import {FilterType, UpdateType} from '../const.js';
import {filter} from '../utils/filter.js';

const FILTERS = [
  {
    type: FilterType.EVERYTHING,
    title: 'Everything',
  },
  {
    type: FilterType.FUTURE,
    title: 'Future',
  },
  {
    type: FilterType.PRESENT,
    title: 'Present',
  },
  {
    type: FilterType.PAST,
    title: 'Past',
  },
];

export default class FilterPresenter {
  #filterContainer = null;
  #filterModel = null;
  #pointsModel = null;

  #filterComponent = null;

  constructor({filterContainer, filterModel, pointsModel}) {
    this.#filterContainer = filterContainer;
    this.#filterModel = filterModel;
    this.#pointsModel = pointsModel;
  }

  init() {
    this.#filterModel.addObserver(this.#handleModelEvent);
    this.#pointsModel.addObserver(this.#handleModelEvent);

    this.#renderFilter();
  }

  #getFilters() {
    const currentFilterType = this.#filterModel.getFilter();
    const points = this.#pointsModel.getPoints();

    return FILTERS.map((filterItem) => ({
      ...filterItem,
      isChecked: filterItem.type === currentFilterType,
      isDisabled: filter[filterItem.type](points).length === 0,
    }));
  }

  #renderFilter() {
    const prevFilterComponent = this.#filterComponent;

    this.#filterComponent = new FilterView({
      filters: this.#getFilters(),
      onFilterTypeChange: this.#handleFilterTypeChange,
    });

    if (prevFilterComponent) {
      remove(prevFilterComponent);
    }

    render(this.#filterComponent, this.#filterContainer);
  }

  #handleFilterTypeChange = (filterType) => {
    if (this.#filterModel.getFilter() === filterType) {
      return;
    }

    this.#filterModel.setFilter(UpdateType.MAJOR, filterType);
  };

  #handleModelEvent = () => {
    this.#renderFilter();
  };
}
