import dayjs from 'dayjs';

const DATE_FORMAT = 'D MMM';

const getSortedPointsByDay = (points) => [...points].sort(
  (pointA, pointB) => new Date(pointA.dateFrom) - new Date(pointB.dateFrom)
);

const getPointDestinationName = (point, destinations) => {
  const destination = destinations.find((item) => item.id === point.destination);

  return destination ? destination.name : '';
};

const getRouteTitle = (points, destinations) => {
  if (points.length === 0) {
    return '';
  }

  const sortedPoints = getSortedPointsByDay(points);

  const destinationNames = sortedPoints
    .map((point) => getPointDestinationName(point, destinations))
    .filter((name) => name !== '');

  if (destinationNames.length === 0) {
    return '';
  }

  if (destinationNames.length <= 3) {
    return destinationNames.join(' — ');
  }

  return `${destinationNames[0]} — ... — ${destinationNames[destinationNames.length - 1]}`;
};

const getTripDates = (points) => {
  if (points.length === 0) {
    return '';
  }

  const sortedPoints = getSortedPointsByDay(points);

  const firstPoint = sortedPoints[0];
  const lastPoint = sortedPoints[sortedPoints.length - 1];

  const dateFrom = dayjs(firstPoint.dateFrom).format(DATE_FORMAT).toUpperCase();
  const dateTo = dayjs(lastPoint.dateTo).format(DATE_FORMAT).toUpperCase();

  return `${dateFrom} — ${dateTo}`;
};

const getPointOffersPrice = (point, offersByType) => {
  const offersBlock = offersByType.find((item) => item.type === point.type);

  if (!offersBlock) {
    return 0;
  }

  return offersBlock.offers
    .filter((offer) => point.offers.includes(offer.id))
    .reduce((sum, offer) => sum + offer.price, 0);
};

const getTripPrice = (points, offersByType) => points.reduce(
  (sum, point) => sum + point.basePrice + getPointOffersPrice(point, offersByType),
  0
);

export {
  getRouteTitle,
  getTripDates,
  getTripPrice,
};
