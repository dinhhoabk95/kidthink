/**
 * `isometricSystem` — phép chiếu đẳng cự (isometric), xoay mô hình 3D theo trục Z,
 * sắp xếp thứ tự vẽ (painter's algorithm) và phát hiện khối lập phương bị che khuất.
 * Mục 7.4 của [`montessori-template-batch.md`](../../../../docs/specs/01-platform/montessori-template-batch.md).
 *
 * System này **độc lập với khuôn** (`BR-MTB-15`): nhận toạ độ khối 3D thuần dữ liệu
 * `{ x, y, z }` và không phụ thuộc vào Zod hay bất kỳ file nào trong `templates/`.
 *
 * Vẽ bằng canvas (`D-RL`), không dùng ảnh dựng sẵn.
 */

export interface CubeCoord {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly colorToken?: string;
}

export type RotationAngle = 0 | 90 | 180 | 270;

export interface IsometricProjection {
  readonly screenX: number;
  readonly screenY: number;
  readonly depth: number;
}

/**
 * Xoay toạ độ một khối quanh trục Z (tâm xoay mặc định kích thước lưới 4×4, tức tâm (1.5, 1.5)).
 * Xoay 90° theo chiều kim đồng hồ: (x, y) -> (y, max - 1 - x)
 */
export function rotateCubeZ(
  cube: CubeCoord,
  angle: RotationAngle,
  gridSize = 4
): CubeCoord {
  const maxIdx = gridSize - 1;
  const { x, y, z, colorToken } = cube;

  switch (angle) {
    case 0:
      return { x, y, z, colorToken };
    case 90:
      return { x: y, y: maxIdx - x, z, colorToken };
    case 180:
      return { x: maxIdx - x, y: maxIdx - y, z, colorToken };
    case 270:
      return { x: maxIdx - y, y: x, z, colorToken };
    default:
      return { x, y, z, colorToken };
  }
}

/**
 * Xoay toàn bộ mô hình khối quanh trục Z.
 */
export function rotateModelZ(
  model: readonly CubeCoord[],
  angle: RotationAngle,
  gridSize = 4
): CubeCoord[] {
  return model.map((c) => rotateCubeZ(c, angle, gridSize));
}

/**
 * Chiếu toạ độ 3D (x, y, z) sang toạ độ 2D màn hình theo phép chiếu đẳng cự (Isometric 30°).
 * - screenX = originX + (x - y) * cos(30°) * cubeSize
 * - screenY = originY + (x + y) * sin(30°) * cubeSize - z * cubeSize
 * - depth = x + y + z (thứ tự vẽ: khối depth nhỏ hơn vẽ trước, depth lớn hơn vẽ sau)
 */
export function projectIsometric(
  cube: CubeCoord,
  originX: number,
  originY: number,
  cubeSize: number
): IsometricProjection {
  // cos(30°) ≈ 0.866025, sin(30°) = 0.5
  const cos30 = 0.866_025_403_78;
  const sin30 = 0.5;

  const screenX = originX + (cube.x - cube.y) * cos30 * cubeSize;
  const screenY =
    originY + (cube.x + cube.y) * sin30 * cubeSize - cube.z * cubeSize;
  const depth = cube.x + cube.y + cube.z * 10;

  return { screenX, screenY, depth };
}

/**
 * Sắp xếp các khối theo thứ tự vẽ từ sau ra trước (Painter's algorithm).
 * Sau khi xoay theo góc `angle`, khối có x + y nhỏ hơn (xa mắt nhìn hơn) và z nhỏ hơn được vẽ trước.
 */
export function sortCubesForRender(
  model: readonly CubeCoord[],
  angle: RotationAngle = 0,
  gridSize = 4
): CubeCoord[] {
  const rotated = rotateModelZ(model, angle, gridSize);
  const withOrig = rotated.map((rot, idx) => ({ rot, orig: model[idx] }));

  withOrig.sort((a, b) => {
    if (a.rot.z !== b.rot.z) {
      return a.rot.z - b.rot.z;
    }
    const depthA = a.rot.x + a.rot.y;
    const depthB = b.rot.x + b.rot.y;
    if (depthA !== depthB) {
      return depthA - depthB;
    }
    if (a.rot.x !== b.rot.x) {
      return a.rot.x - b.rot.x;
    }
    return a.rot.y - b.rot.y;
  });

  return withOrig.map((item) => item.rot);
}

/**
 * Kiểm tra xem mọi khối có liên thông với nhau không (qua 6 mặt kề nhau).
 */
export function isModelConnected(model: readonly CubeCoord[]): boolean {
  if (model.length <= 1) {
    return true;
  }

  const key = (c: CubeCoord) => `${c.x},${c.y},${c.z}`;
  const coordSet = new Set(model.map(key));
  const visited = new Set<string>();

  const queue: CubeCoord[] = [model[0]];
  visited.add(key(model[0]));

  const deltas = [
    { dx: 1, dy: 0, dz: 0 },
    { dx: -1, dy: 0, dz: 0 },
    { dx: 0, dy: 1, dz: 0 },
    { dx: 0, dy: -1, dz: 0 },
    { dx: 0, dy: 0, dz: 1 },
    { dx: 0, dy: 0, dz: -1 },
  ];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (!curr) {
      break;
    }
    for (const d of deltas) {
      const neighborKey = `${curr.x + d.dx},${curr.y + d.dy},${curr.z + d.dz}`;
      if (coordSet.has(neighborKey) && !visited.has(neighborKey)) {
        visited.add(neighborKey);
        const neighbor = model.find((c) => key(c) === neighborKey);
        if (neighbor) {
          queue.push(neighbor);
        }
      }
    }
  }

  return visited.size === model.length;
}

/**
 * Kiểm tra xem có khối lơ lửng không:
 * Mọi khối ở tầng z > 0 phải có khối đỡ trực tiếp ở (x, y, z - 1).
 */
export function hasNoFloatingCubes(model: readonly CubeCoord[]): boolean {
  const coordSet = new Set(model.map((c) => `${c.x},${c.y},${c.z}`));

  for (const c of model) {
    if (c.z > 0) {
      const belowKey = `${c.x},${c.y},${c.z - 1}`;
      if (!coordSet.has(belowKey)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Kiểm tra xem một khối có bị che khuất hoàn toàn từ góc nhìn chuẩn không.
 * Góc nhìn chuẩn nhìn từ góc trước (x lớn, y lớn nhìn về (0,0)).
 */
export function isCubeHidden(
  cube: CubeCoord,
  allCubes: readonly CubeCoord[],
  angle: RotationAngle = 0,
  gridSize = 4
): boolean {
  const rotatedModel = rotateModelZ(allCubes, angle, gridSize);
  const rotCube = rotateCubeZ(cube, angle, gridSize);
  const coordSet = new Set(rotatedModel.map((c) => `${c.x},${c.y},${c.z}`));

  const hasTop = coordSet.has(`${rotCube.x},${rotCube.y},${rotCube.z + 1}`);
  const hasFrontRight = coordSet.has(
    `${rotCube.x + 1},${rotCube.y},${rotCube.z}`
  );
  const hasFrontLeft = coordSet.has(
    `${rotCube.x},${rotCube.y + 1},${rotCube.z}`
  );

  return hasTop && hasFrontRight && hasFrontLeft;
}

/**
 * Đếm số khối bị che khuất từ góc nhìn (angle).
 */
export function countHiddenCubes(
  model: readonly CubeCoord[],
  angle: RotationAngle = 0,
  gridSize = 4
): number {
  return model.filter((c) => isCubeHidden(c, model, angle, gridSize)).length;
}

/**
 * Tính ma trận nhìn từ trên xuống (top view): trả về ma trận gridSize × gridSize
 * với mỗi ô là số lượng khối xếp chồng tại (x, y).
 */
export function computeTopView(
  model: readonly CubeCoord[],
  gridSize = 4
): number[][] {
  const heights: number[][] = Array.from({ length: gridSize }, () =>
    new Array(gridSize).fill(0)
  );

  for (const c of model) {
    if (c.x >= 0 && c.x < gridSize && c.y >= 0 && c.y < gridSize) {
      heights[c.y][c.x] = Math.max(heights[c.y][c.x], c.z + 1);
    }
  }

  return heights;
}
