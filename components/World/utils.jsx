import * as THREE from 'three';

export const CATEGORY_COLORS = {
  events: 0x00ff00,  // Green
  items: 0xffa500,   // Orange
  people: 0x0000ff,  // Blue
  default: 0xff0000  // Red (default color)
};

export const GLOBE_RADIUS = 1;
export const POINT_SIZE = 0.015;
export const FRUSTUM_SIZE = 4.0;
export const AUTO_ROTATE_SPEED = 0.5;

export const latLongToVector3 = (lat, lon, radius = GLOBE_RADIUS) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
};

export const formatCoordinate = (coordinate, positiveDirection, negativeDirection) => {
  const direction = coordinate >= 0 ? positiveDirection : negativeDirection;
  return `${Math.abs(coordinate).toFixed(4)}°&nbsp;${direction}`;
};

export const cartesianToLatLong = (position) => {
  const lat = 90 - Math.acos(position.y) * 180 / Math.PI;
  const lng = (270 + Math.atan2(position.x, position.z) * 180 / Math.PI) % 360 - 180;
  return formatCoordinate(lat, 'N', 'S') + ",&nbsp;" + formatCoordinate(lng, 'E', 'W');
};

export const formatCoordinates = (lat, lon) => {
  return `${formatCoordinate(lat, 'N', 'S')}, ${formatCoordinate(lon, 'E', 'W')}`;
};

export const getCategoryColor = (category) => {
  // Define your color mapping here
  const colorMap = {
    profiles: 0xFF0000, // Red
    events: 0x00FF00,   // Green
    // Add more categories and colors as needed
  };

  return colorMap[category] || 0xFFFFFF; // Default to white if category not found
};