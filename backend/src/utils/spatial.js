export function isValidCoordinate(latitude, longitude) {
  return Number.isFinite(Number(latitude))
    && Number(latitude) >= -90 && Number(latitude) <= 90
    && Number.isFinite(Number(longitude))
    && Number(longitude) >= -180 && Number(longitude) <= 180;
}
