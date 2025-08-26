export function getRandomPosition() {
  return {
    x: Math.random() * 400,
    y: Math.random() * 400,
  };
}

export function clampPosition(position: { x: number; y: number }, bounds: { width: number; height: number }) {
  return {
    x: Math.max(0, Math.min(position.x, bounds.width - 250)), // Assuming card width of 250px
    y: Math.max(0, Math.min(position.y, bounds.height - 200)), // Assuming card height of 200px
  };
}

export function calculateDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

export function isOverlapping(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

export function snapToGrid(position: { x: number; y: number }, gridSize: number = 20) {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}
