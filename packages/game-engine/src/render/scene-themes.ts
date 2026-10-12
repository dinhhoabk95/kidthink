import type { RenderSystem } from "#src/systems/render-system";
import {
  drawArtScene,
  drawBodyScene,
  drawFamilyScene,
  drawFestivalScene,
  drawFoodScene,
  drawHomeScene,
  drawSchoolScene,
} from "./scene-themes-indoor.js";
import {
  drawAnimalScene,
  drawFarmScene,
  drawNatureScene,
  drawOceanScene,
  drawSpaceScene,
  drawVehicleScene,
  drawWeatherScene,
} from "./scene-themes-outdoor.js";

type ScenePainter = (
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  w: number,
  h: number
) => void;

/** Hoạ sĩ nền theo chủ đề; chủ đề lạ rơi về nền mặc định. `Map` thay object: tra
 * `"constructor"` trên object trả về hàm của `Object.prototype`. */
export const SCENE_PAINTERS: ReadonlyMap<string, ScenePainter> = new Map([
  ["nature", drawNatureScene],
  ["farm", drawFarmScene],
  ["ocean", drawOceanScene],
  ["space", drawSpaceScene],
  ["school", drawSchoolScene],
  ["home", drawHomeScene],
  ["animal", drawAnimalScene],
  ["food", drawFoodScene],
  ["vehicle", drawVehicleScene],
  ["art", drawArtScene],
  ["family", drawFamilyScene],
  ["body", drawBodyScene],
  ["weather", drawWeatherScene],
  ["festival", drawFestivalScene],
]);
